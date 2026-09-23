import { useState, useRef, useEffect } from 'react';
import { savePostgresConfig, saveS3Config } from '../services/connectionStorage';
import { showSuccess, showWarning } from '../utils/toast';

export function useWorkflowCanvas(tenant) {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingSourceId, setConnectingSourceId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Drag & Drop Handlers from Sidebar onto Canvas
  const handleDragStartFromSidebar = (e, type, subtype, nodeKey) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, subtype, nodeKey }));
  };

  const handleDragOverCanvas = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const dropX = Math.max(20, Math.min(e.clientX - canvasRect.left - 110, canvasRect.width - 240));
      const dropY = Math.max(20, Math.min(e.clientY - canvasRect.top - 50, canvasRect.height - 200));

      createNode(data.type, data.subtype, data.nodeKey, dropX, dropY);
    } catch (err) {
      console.error('Failed to create node on drop:', err);
    }
  };

  /**
   * Flexible createNode supporting multiple argument patterns:
   *  - createNode(type, subtype)
   *  - createNode(type, subtype, nodeKey)
   *  - createNode(type, subtype, targetX, targetY)
   *  - createNode(type, subtype, nodeKey, targetX, targetY)
   */
  const createNode = (type, subtype, arg3 = null, arg4 = null, arg5 = null) => {
    let nodeKey = null;
    let targetX = null;
    let targetY = null;

    if (typeof arg3 === 'number') {
      targetX = arg3;
      targetY = typeof arg4 === 'number' ? arg4 : null;
    } else if (typeof arg3 === 'string') {
      nodeKey = arg3;
      if (typeof arg4 === 'number') {
        targetX = arg4;
        targetY = typeof arg5 === 'number' ? arg5 : null;
      }
    }

    const id = `node_${type}_${Date.now()}`;

    let defaultX = type === 'source' ? 60 : 440;
    let defaultY = 140;

    const sameTypeCount = nodes.filter((n) => n.type === type).length;
    if (sameTypeCount > 0) {
      defaultX += (sameTypeCount % 3) * 30;
      defaultY += sameTypeCount * 40;
    }

    const finalX = typeof targetX === 'number' ? Math.round(targetX) : defaultX;
    const finalY = typeof targetY === 'number' ? Math.round(targetY) : defaultY;

    // Helper title, subtitle & config per subtype
    let title = `${subtype.toUpperCase()} ${type === 'source' ? 'Source' : 'Destination'}`;
    let subtitle = 'Enter details...';
    let config = { name: '' };

    if (subtype === 'postgres') {
      title = 'Database Source (PostgreSQL)';
      subtitle = 'Enter database details...';
      config = { name: '', host: '', port: '5432', database: '', username: '', password: '', useSSL: false, backupSchedule: '', retentionDays: '' };
    } else if (subtype === 'mysql') {
      title = 'MySQL Database Source';
      subtitle = 'Enter MySQL details...';
      config = { name: '', host: '', port: '3306', database: '', username: '', password: '' };
    } else if (subtype === 'kafka') {
      title = 'Apache Kafka Stream';
      subtitle = 'bootstrap:9092';
      config = { name: '', bootstrapServers: '', topic: '', groupId: '', saslPassword: '' };
    } else if (subtype === 'mongodb') {
      title = 'MongoDB Document Store';
      subtitle = 'Enter MongoDB URI...';
      config = { name: '', connectionString: '', database: '', collection: '' };
    } else if (subtype === 'webhook') {
      title = 'HTTP Webhook Trigger';
      subtitle = '/api/v1/webhooks';
      config = { name: '', endpointUrl: '', secretToken: '' };
    } else if (subtype === 's3') {
      title = 'Amazon S3 Vault';
      subtitle = 's3://vault/';
      config = { name: '', bucketName: '', region: 'us-east-1', accessKeyId: '', secretAccessKey: '', folderPath: '' };
    } else if (subtype === 'gcs') {
      title = 'Google Cloud Storage (GCS)';
      subtitle = 'gs://bucket/';
      config = { name: '', bucketName: '', projectId: '', serviceAccountJson: '' };
    } else if (subtype === 'redis') {
      title = 'Redis Cache Vault';
      subtitle = 'redis:6379';
      config = { name: '', host: '', port: '6379', password: '' };
    } else if (subtype === 'snowflake') {
      title = 'Snowflake Data Warehouse';
      subtitle = 'Enter account ID...';
      config = { name: '', account: '', username: '', password: '', warehouse: '', database: '' };
    } else if (subtype === 'pinecone') {
      title = 'Pinecone Vector DB';
      subtitle = 'Enter index name...';
      config = { name: '', environment: '', indexName: '', apiKey: '' };
    }

    const newNode = {
      id,
      nodeKey: nodeKey || `${subtype}_${type}`,
      type,
      subtype,
      x: finalX,
      y: finalY,
      isValid: false,
      title,
      subtitle,
      config,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.sourceId !== id && c.targetId !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    if (e.target.closest('.port-dot') || e.target.closest('.delete-btn')) return;

    e.preventDefault();

    setSelectedNodeId(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const offset = {
      x: clientX - canvasRect.left - Number(node.x || 0),
      y: clientY - canvasRect.top - Number(node.y || 0),
    };

    dragOffsetRef.current = offset;
    setDraggingNodeId(nodeId);
  };

  useEffect(() => {
    if (!draggingNodeId) return;

    const handleWindowMove = (e) => {
      if (!canvasRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let newX = clientX - canvasRect.left - dragOffsetRef.current.x;
      let newY = clientY - canvasRect.top - dragOffsetRef.current.y;

      newX = Math.max(10, Math.min(newX, canvasRect.width - 240));
      newY = Math.max(10, Math.min(newY, canvasRect.height - 120));

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n))
      );
    };

    const handleWindowEnd = () => {
      setDraggingNodeId(null);
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowEnd);
    window.addEventListener('touchmove', handleWindowMove, { passive: false });
    window.addEventListener('touchend', handleWindowEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowEnd);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowEnd);
    };
  }, [draggingNodeId]);

  const handlePortClick = (node) => {
    if (node.type === 'source') {
      setConnectingSourceId(node.id);
      showSuccess(`Selected "${node.config?.name || node.title}" as source port. Now click Green dot on Destination!`, 'Source Port Selected');
    } else if (node.type === 'destination') {
      if (!connectingSourceId) {
        showWarning('Please click the Blue Output Dot on a Source node first, then click this Green Input Dot.', 'Connect Wire');
        return;
      }

      if (connectingSourceId === node.id) return;

      const exists = connections.some((c) => c.sourceId === connectingSourceId && c.targetId === node.id);
      if (!exists) {
        const newConn = { id: `conn_${Date.now()}`, sourceId: connectingSourceId, targetId: node.id };
        setConnections((prev) => [...prev, newConn]);
        showSuccess('Connection wire established between Source and Destination!', 'Wire Connected');
      }
      setConnectingSourceId(null);
    }
  };

  const handleUpdateConfig = (key, value, onFieldChange) => {
    if (onFieldChange) onFieldChange(key);

    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === selectedNodeId) {
          const updatedConfig = { ...node.config, [key]: value };
          let updatedSubtitle = node.subtitle;
          let updatedTitle = node.title;

          if (key === 'name' && value) {
            updatedTitle = value;
          }

          if (node.subtype === 'postgres') {
            savePostgresConfig(updatedConfig);
            if (key === 'database') updatedSubtitle = value || 'Enter database name...';
          } else if (node.subtype === 's3') {
            saveS3Config(updatedConfig);
            if (key === 'bucketName' || key === 'folderPath') {
              const bucket = updatedConfig.bucketName || '[bucket-name]';
              const path = updatedConfig.folderPath || '';
              updatedSubtitle = `s3://${bucket}/${path}`;
            }
          }

          return {
            ...node,
            isValid: false,
            title: updatedTitle,
            subtitle: updatedSubtitle,
            config: updatedConfig,
          };
        }
        return node;
      })
    );
  };

  return {
    canvasRef,
    nodes,
    setNodes,
    connections,
    setConnections,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    connectingSourceId,
    setConnectingSourceId,
    handleDragStartFromSidebar,
    handleDragOverCanvas,
    handleDropOnCanvas,
    createNode,
    handleDeleteNode,
    handleNodeMouseDown,
    handlePortClick,
    handleUpdateConfig,
  };
}

