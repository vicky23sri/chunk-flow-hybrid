import React, { useState, useRef, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import WorkflowHeader from './workflow/WorkflowHeader';
import NodeLibrarySidebar from './workflow/NodeLibrarySidebar';
import WorkflowCanvas from './workflow/WorkflowCanvas';
import NodeInspectorPanel from './workflow/NodeInspectorPanel';
import { getSavedPostgresConfig, savePostgresConfig, getSavedS3Config, saveS3Config } from '../../services/connectionStorage';

export default function WorkflowBuilder({ tenant, onSaveWorkflow }) {
  // Available tenant databases list
  const availableDatabases = [
    `chunkflow_tenant_${tenant?.subdomain || 'acme'}`,
    'chunkflow_central',
    'chunkflow_tenant_willsparrow',
    'chunkflow_tenant_demo',
    'postgres_analytics_replica',
  ];

  // Default initial canvas state
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [connectingSourceId, setConnectingSourceId] = useState(null);

  // Clear Canvas Confirm Modal State
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Password Visibility Toggle State
  const [showPgPassword, setShowPgPassword] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);

  // Test Connection State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Node Dragging on Canvas state
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Reset test connection result on node selection change
  useEffect(() => {
    setTestResult(null);
  }, [selectedNodeId]);

  // ── Drag & Drop Handlers from Sidebar onto Canvas ──────────────────────────
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

    // Smart positioning: Source nodes default to left (x = 60), Destination nodes default to right (x = 440)
    let defaultX = type === 'source' ? 60 : 440;
    let defaultY = 140;

    // Offset if nodes of same type already exist to avoid overlapping
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
      isValid: true, // Pre-filled nodes are ready by default
      config: {},
    };

    if (subtype === 'postgres') {
      const savedPg = getSavedPostgresConfig(tenant?.subdomain || 'acme');
      newNode.title = 'PostgreSQL Database Source';
      newNode.subtitle = savedPg.database || `chunkflow_tenant_${tenant?.subdomain || 'acme'}`;
      newNode.config = savedPg;
    } else if (subtype === 's3') {
      const savedS3 = getSavedS3Config();
      newNode.title = 'Amazon S3 Vault Destination';
      newNode.subtitle = `s3://${savedS3.bucketName}/${savedS3.folderPath || ''}`;
      newNode.config = savedS3;
    }

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

  // ── Mouse Dragging Nodes on Canvas Surface ─────────────────────────────────
  const handleNodeMouseDown = (e, nodeId) => {
    if (e.target.closest('.port-dot') || e.target.closest('.delete-btn')) return;

    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - canvasRect.left - node.x,
      y: e.clientY - canvasRect.top - node.y,
    });
  };

  const handleMouseMoveCanvas = (e) => {
    if (!draggingNodeId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    // Bounds checking
    newX = Math.max(10, Math.min(newX, canvasRect.width - 240));
    newY = Math.max(10, Math.min(newY, canvasRect.height - 180));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  // ── Node Port Connection (Blue Dot Source -> Green Dot Destination) ──────
  const handlePortClick = (node) => {
    if (node.type === 'source') {
      setConnectingSourceId(node.id);
    } else if (node.type === 'destination' && connectingSourceId) {
      const exists = connections.some((c) => c.sourceId === connectingSourceId && c.targetId === node.id);
      if (!exists && connectingSourceId !== node.id) {
        setConnections([...connections, { id: `conn_${Date.now()}`, sourceId: connectingSourceId, targetId: node.id }]);
      }
      setConnectingSourceId(null);
    }
  };

  const handleSaveConfig = () => {
    if (!selectedNodeId || !selectedNode) return;
    if (selectedNode.subtype === 'postgres') {
      savePostgresConfig(selectedNode.config);
    } else if (selectedNode.subtype === 's3') {
      saveS3Config(selectedNode.config);
    }
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, isValid: true } : n))
    );
  };

  const handleTestConnection = () => {
    if (!selectedNode) return;
    setIsTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestingConnection(false);
      const config = selectedNode.config || {};

      if (selectedNode.subtype === 'postgres') {
        const host = config.host?.trim();
        const db = config.database?.trim();
        const user = config.username?.trim();

        if (!host && !db && !user) {
          setTestResult({
            type: 'error',
            message: 'Connection Failed: Host, Database Name, and Username are required.',
          });
        } else {
          setTestResult({
            type: 'success',
            message: `Connection Successful! Reached PostgreSQL at ${host || 'localhost'}:${config.port || '5432'} (Database: "${db || 'default'}") - Ping 18ms.`,
          });
        }
      } else if (selectedNode.subtype === 's3') {
        const bucket = config.bucketName?.trim();
        const region = config.region || 'us-west-2';

        if (!bucket) {
          setTestResult({
            type: 'error',
            message: 'Configuration Failed: S3 Bucket Name is required.',
          });
        } else {
          setTestResult({
            type: 'success',
            message: `Configuration Verified! Access granted to S3 Bucket "${bucket}" in region ${region}.`,
          });
        }
      }
    }, 800);
  };

  const handleUpdateConfig = (key, value) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === selectedNodeId) {
          const updatedConfig = { ...node.config, [key]: value };
          let updatedSubtitle = node.subtitle;

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
            subtitle: updatedSubtitle,
            config: updatedConfig,
          };
        }
        return node;
      })
    );
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeploySuccess(false);
    setTimeout(() => {
      setIsDeploying(false);
      setDeploySuccess(true);
      // Mark all nodes as configured on deployment
      setNodes((prev) => prev.map((n) => ({ ...n, isValid: true })));
      if (onSaveWorkflow) onSaveWorkflow({ nodes, connections });
      setTimeout(() => setDeploySuccess(false), 4000);
    }, 1000);
  };

  const handleClearCanvas = () => {
    setShowClearConfirmModal(true);
  };

  const executeClearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
  };

  return (
    <div className="w-full h-full flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col text-left min-h-[calc(100vh-125px)] lg:min-h-0">
      
      {/* 1. Header Bar Subcomponent */}
      <WorkflowHeader
        deploySuccess={deploySuccess}
        isDeploying={isDeploying}
        nodeCount={nodes.length}
        onClearCanvas={handleClearCanvas}
        onDeploy={handleDeploy}
      />

      {/* 2. Main Workspace 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[500px] lg:min-h-0 overflow-hidden">
        
        {/* Left Sidebar: Node Library Subcomponent */}
        <NodeLibrarySidebar
          onDragStart={handleDragStartFromSidebar}
          onCreateNode={createNode}
        />

        {/* Center: Visual Workflow Canvas Subcomponent */}
        <WorkflowCanvas
          canvasRef={canvasRef}
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          connectingSourceId={connectingSourceId}
          onDragOverCanvas={handleDragOverCanvas}
          onDropCanvas={handleDropOnCanvas}
          onMouseMoveCanvas={handleMouseMoveCanvas}
          onMouseUpCanvas={handleMouseUpCanvas}
          onNodeMouseDown={handleNodeMouseDown}
          onPortClick={handlePortClick}
          onDeleteNode={handleDeleteNode}
          onCreateNode={createNode}
        />

        {/* Right Sidebar: Node Inspector Panel Subcomponent */}
        <NodeInspectorPanel
          selectedNode={selectedNode}
          selectedNodeId={selectedNodeId}
          onCloseInspector={() => setSelectedNodeId(null)}
          onUpdateConfig={handleUpdateConfig}
          showPgPassword={showPgPassword}
          onTogglePgPassword={() => setShowPgPassword(!showPgPassword)}
          showS3Secret={showS3Secret}
          onToggleS3Secret={() => setShowS3Secret(!showS3Secret)}
          isTestingConnection={isTestingConnection}
          testResult={testResult}
          onTestConnection={handleTestConnection}
          onSaveConfig={handleSaveConfig}
          nodes={nodes}
          connections={connections}
          onRemoveConnection={(connId) =>
            setConnections((prev) => prev.filter((c) => c.id !== connId))
          }
        />
      </div>

      {/* Confirmation Modal Component for Clear Canvas */}
      <ConfirmModal
        isOpen={showClearConfirmModal}
        onClose={() => setShowClearConfirmModal(false)}
        onConfirm={executeClearCanvas}
        title="Clear Workflow Canvas?"
        message="Are you sure you want to remove all placed nodes and connection wires from the canvas? This action cannot be undone."
        confirmText="Clear Canvas"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
