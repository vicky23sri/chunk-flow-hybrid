import { useState, useRef, useEffect } from 'react';
import { getSavedPostgresConfig, savePostgresConfig, getSavedS3Config, saveS3Config } from '../services/connectionStorage';

export function useWorkflowCanvas(tenant) {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingSourceId, setConnectingSourceId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Drag & Drop Handlers from Sidebar onto Canvas
  const handleDragStartFromSidebar = (e, type, subtype) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, subtype }));
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

      createNode(data.type, data.subtype, dropX, dropY);
    } catch (err) {
      console.error('Failed to create node on drop:', err);
    }
  };

  const createNode = (type, subtype, targetX = null, targetY = null) => {
    const id = `node_${type}_${Date.now()}`;

    let defaultX = type === 'source' ? 60 : 440;
    let defaultY = 140;

    const sameTypeCount = nodes.filter((n) => n.type === type).length;
    if (sameTypeCount > 0) {
      defaultX += (sameTypeCount % 3) * 30;
      defaultY += sameTypeCount * 40;
    }

    const finalX = targetX !== null ? targetX : defaultX;
    const finalY = targetY !== null ? targetY : defaultY;

    let newNode = {
      id,
      type,
      subtype,
      x: finalX,
      y: finalY,
      isValid: false,
      title: subtype === 'postgres' ? 'Database Source' : 'Amazon S3 Vault Destination',
      subtitle: subtype === 'postgres' ? 'Enter database details...' : 'Enter S3 vault details...',
      config: subtype === 'postgres' ? {
        name: '',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        useSSL: false,
        backupSchedule: '',
        retentionDays: '',
      } : {
        name: '',
        bucketName: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
        folderPath: '',
      },
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
    setDraggingNodeId(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragOffset({
      x: clientX - canvasRect.left - node.x,
      y: clientY - canvasRect.top - node.y,
    });
  };

  useEffect(() => {
    if (!draggingNodeId) return;

    const handleWindowMove = (e) => {
      if (!canvasRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let newX = clientX - canvasRect.left - dragOffset.x;
      let newY = clientY - canvasRect.top - dragOffset.y;

      newX = Math.max(10, Math.min(newX, canvasRect.width - 235));
      newY = Math.max(10, Math.min(newY, canvasRect.height - 140));

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
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
  }, [draggingNodeId, dragOffset]);

  const handlePortClick = (node) => {
    if (node.type === 'source') {
      setConnectingSourceId(node.id);
    } else if (node.type === 'destination' && connectingSourceId) {
      const exists = connections.some((c) => c.sourceId === connectingSourceId && c.targetId === node.id);
      if (!exists && connectingSourceId !== node.id) {
        setConnections((prev) => [...prev, { id: `conn_${Date.now()}`, sourceId: connectingSourceId, targetId: node.id }]);
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

          if (key === 'name') {
            updatedTitle = value || (node.subtype === 'postgres' ? 'Database Source' : 'Amazon S3 Vault Destination');
          }

          if (node.subtype === 'postgres') {
            savePostgresConfig(updatedConfig);
            if (key === 'database') {
              updatedSubtitle = value || 'Enter database name...';
            }
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
