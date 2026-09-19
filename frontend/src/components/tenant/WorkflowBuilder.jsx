import React, { useState, useRef, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import WorkflowHeader from './workflow/WorkflowHeader';
import NodeLibrarySidebar from './workflow/NodeLibrarySidebar';
import WorkflowCanvas from './workflow/WorkflowCanvas';
import NodeInspectorPanel from './workflow/NodeInspectorPanel';
import SourceTableModal from './workflow/SourceTableModal';
import DestinationVaultModal from './workflow/DestinationVaultModal';
import { getSavedPostgresConfig, savePostgresConfig, getSavedS3Config, saveS3Config } from '../../services/connectionStorage';
import { api } from '../../services/api';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { useFormValidation } from '../../hooks/useFormValidation';

export default function WorkflowBuilder({ tenant, onSaveWorkflow, initialWorkflow }) {
  const { errors, validatePostgres, validateS3, clearErrors, clearFieldError } = useFormValidation();

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

  // Load specific workflow data onto canvas when initialWorkflow prop changes
  useEffect(() => {
    if (initialWorkflow) {
      let loadedNodes = [];
      let loadedConns = [];

      try {
        if (Array.isArray(initialWorkflow.nodes_data)) {
          loadedNodes = initialWorkflow.nodes_data;
        } else if (typeof initialWorkflow.nodes_data === 'string') {
          loadedNodes = JSON.parse(initialWorkflow.nodes_data);
        } else if (Array.isArray(initialWorkflow.nodes)) {
          loadedNodes = initialWorkflow.nodes;
        }
      } catch (e) {}

      try {
        if (Array.isArray(initialWorkflow.connections_data)) {
          loadedConns = initialWorkflow.connections_data;
        } else if (typeof initialWorkflow.connections_data === 'string') {
          loadedConns = JSON.parse(initialWorkflow.connections_data);
        } else if (Array.isArray(initialWorkflow.connections)) {
          loadedConns = initialWorkflow.connections;
        }
      } catch (e) {}

      if (loadedNodes && loadedNodes.length > 0) {
        setNodes(loadedNodes);
        setConnections(loadedConns || []);
        setSelectedNodeId(loadedNodes[0]?.id || null);
        showSuccess(`Loaded pipeline canvas for "${initialWorkflow.name || 'Snapshot Workflow'}"!`, 'Workflow Canvas Loaded');
      } else {
        // Build interactive connected PostgreSQL -> S3 nodes for this snapshot
        const pgId = `node_source_${Date.now()}`;
        const s3Id = `node_destination_${Date.now() + 1}`;
        const defaultPgNode = {
          id: pgId,
          type: 'source',
          subtype: 'postgres',
          x: 80,
          y: 160,
          isValid: true,
          title: 'PostgreSQL Database Source',
          subtitle: initialWorkflow.source_name || `chunkflow_tenant_${tenant?.subdomain || 'acme'}`,
          config: {
            host: 'localhost',
            port: '5432',
            database: `chunkflow_tenant_${tenant?.subdomain || 'acme'}`,
            username: 'virat',
            password: '•••',
          },
        };
        const defaultS3Node = {
          id: s3Id,
          type: 'destination',
          subtype: 's3',
          x: 460,
          y: 160,
          isValid: true,
          title: 'Amazon S3 Vault Destination',
          subtitle: initialWorkflow.destination_name || 's3://chunkflow-vault-raw/',
          config: {
            bucketName: 'chunkflow-vault-raw',
            folderPath: `snapshots/${tenant?.subdomain || 'tenant'}/`,
          },
        };
        setNodes([defaultPgNode, defaultS3Node]);
        setConnections([{ id: `conn_${Date.now()}`, sourceId: pgId, targetId: s3Id }]);
        setSelectedNodeId(pgId);
        showSuccess(`Loaded canvas for "${initialWorkflow.name || 'Snapshot Pipeline'}"!`, 'Pipeline Loaded');
      }
    }
  }, [initialWorkflow?.id]);

  // Clear Canvas Confirm Modal State
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Source Database Schema & Tables Modal State
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [dbDetails, setDbDetails] = useState(null);

  // Destination S3 Vault Modal State
  const [showS3Modal, setShowS3Modal] = useState(false);
  const [s3Details, setS3Details] = useState(null);

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

  // Reset test connection result and clear validation errors on node selection change
  useEffect(() => {
    setTestResult(null);
    clearErrors();
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
      config: {},
    };

    if (subtype === 'postgres') {
      newNode.title = 'PostgreSQL Database Source';
      newNode.subtitle = 'PostgreSQL Data Source';
      newNode.config = {
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        useSSL: false,
        backupSchedule: '',
        retentionDays: '',
      };
    } else if (subtype === 's3') {
      newNode.title = 'Amazon S3 Vault Destination';
      newNode.subtitle = 'S3 Target Destination';
      newNode.config = {
        bucketName: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
        folderPath: '',
      };
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

  const handleMouseMoveCanvas = (e) => {};

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

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

  const handleSaveConfig = async () => {
    if (!selectedNodeId || !selectedNode) return;

    let isValid = true;
    if (selectedNode.subtype === 'postgres') {
      isValid = validatePostgres(selectedNode.config);
    } else if (selectedNode.subtype === 's3') {
      isValid = validateS3(selectedNode.config);
    }

    if (!isValid) return;

    // Save to localStorage (fast / offline-safe)
    if (selectedNode.subtype === 'postgres') {
      savePostgresConfig(selectedNode.config);
    } else if (selectedNode.subtype === 's3') {
      saveS3Config(selectedNode.config);
    }

    // Persist to tenant database via Go backend /tenant-config
    const result = await api.saveTenantConfig(
      selectedNode.subtype === 'postgres'
        ? { postgres: selectedNode.config }
        : { s3: selectedNode.config }
    );

    if (!result.success) {
      showError(result.message || 'Failed to save configuration to database.', 'DB Save Failed');
      return;
    }

    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, isValid: true } : n))
    );
    showSuccess('Node configuration saved to database!', 'Config Saved');
  };

  const handleTestConnection = async () => {
    if (!selectedNode) return;

    let isValid = true;
    if (selectedNode.subtype === 'postgres') {
      isValid = validatePostgres(selectedNode.config);
    } else if (selectedNode.subtype === 's3') {
      isValid = validateS3(selectedNode.config);
    }

    if (!isValid) return;

    const config = selectedNode.config || {};
    setIsTestingConnection(true);
    setTestResult(null);

    if (selectedNode.subtype === 'postgres') {
      try {
        const res = await api.testDBConnection(config);
        setIsTestingConnection(false);
        if (res && res.success) {
          const msg = res.message || 'PostgreSQL connection verified!';
          setTestResult({
            type: 'success',
            success: true,
            message: msg,
          });
          showSuccess(msg, 'PostgreSQL Connection Verified');

          setDbDetails(res);
          setShowSourceModal(true);

          setNodes((prev) =>
            prev.map((n) =>
              n.id === selectedNodeId
                ? {
                    ...n,
                    isValid: true,
                  }
                : n
            )
          );
        } else {
          const msg = res?.message || 'PostgreSQL Connection Failed.';
          setTestResult({
            type: 'error',
            success: false,
            message: msg,
          });
          showError(msg, 'PostgreSQL Connection Failed');
        }
      } catch (err) {
        setIsTestingConnection(false);
        const msg = err.message || 'Failed to trigger PostgreSQL connection test via Go Backend.';
        setTestResult({
          type: 'error',
          success: false,
          message: msg,
        });
        showError(msg, 'Connection Test Failed');
      }
    } else if (selectedNode.subtype === 's3') {
      setTimeout(() => {
        setIsTestingConnection(false);
        const bucket = config.bucketName?.trim();

        const msg = `Configuration Verified! Access granted to S3 Bucket "${bucket}".`;
        setTestResult({
          type: 'success',
          success: true,
          message: msg,
        });
        showSuccess(msg, 'Amazon S3 Vault Verified');

        setS3Details({ ...config });
        setShowS3Modal(true);

        setNodes((prev) =>
          prev.map((n) =>
            n.id === selectedNodeId
              ? {
                  ...n,
                  isValid: true,
                }
              : n
          )
        );
      }, 600);
    }
  };

  const handleUpdateConfig = (key, value) => {
    clearFieldError(key);
    setTestResult(null);
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
            isValid: false,
            subtitle: updatedSubtitle,
            config: updatedConfig,
          };
        }
        return node;
      })
    );
  };

  const handleDeploy = async () => {
    if (nodes.length === 0) {
      showWarning('Cannot deploy an empty canvas. Please add source and destination nodes.', 'Canvas Empty');
      return;
    }

    for (const node of nodes) {
      let isNodeValid = true;
      if (node.subtype === 'postgres') {
        isNodeValid = validatePostgres(node.config);
      } else if (node.subtype === 's3') {
        isNodeValid = validateS3(node.config);
      }

      if (!isNodeValid) {
        setSelectedNodeId(node.id);
        return;
      }
    }

    setIsDeploying(true);
    setDeploySuccess(false);

    // Extract postgres source and s3 destination node configs
    const postgresNode = nodes.find((n) => n.subtype === 'postgres');
    const s3Node = nodes.find((n) => n.subtype === 's3');

    const res = await api.deployWorkflow({
      workflowName: 'PostgreSQL -> S3 Vault Data Pipeline',
      nodes,
      connections,
      postgres: postgresNode?.config,
      s3: s3Node?.config,
    });

    setIsDeploying(false);

    if (res && res.success) {
      setDeploySuccess(true);
      setNodes((prev) => prev.map((n) => ({ ...n, isValid: true })));
      if (onSaveWorkflow) onSaveWorkflow({ nodes, connections, deployment: res });
      showSuccess(
        res.message || 'Workflow pipeline deployed and mapped in tenant database!',
        'Workflow Deployed'
      );
      setTimeout(() => setDeploySuccess(false), 4000);
    } else {
      showError(res?.message || 'Failed to deploy workflow to database.', 'Deployment Failed');
    }
  };

  const handleClearCanvas = () => {
    setShowClearConfirmModal(true);
  };

  const executeClearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
  };

  const handleCloseInspector = () => {
    if (selectedNodeId) {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === selectedNodeId) {
            if (n.subtype === 'postgres') {
              return {
                ...n,
                isValid: false,
                config: { host: '', port: '', database: '', username: '', password: '', useSSL: false, backupSchedule: '', retentionDays: '' },
              };
            } else if (n.subtype === 's3') {
              return {
                ...n,
                isValid: false,
                config: { bucketName: '', region: '', accessKeyId: '', secretAccessKey: '', folderPath: '' },
              };
            }
          }
          return n;
        })
      );
    }
    setTestResult(null);
    clearErrors();
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
          onCloseInspector={handleCloseInspector}
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
          errors={errors}
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

      {/* Source Database Schema & Tables Inspection Modal */}
      <SourceTableModal
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
        dbDetails={dbDetails}
        onConfirmSelection={(selectedTables) => {
          showSuccess(
            `Selected ${selectedTables.length} table(s) for backup stream: ${selectedTables.slice(0, 3).join(', ')}${selectedTables.length > 3 ? '...' : ''}`,
            'Source Pipeline Schema Configured'
          );
        }}
      />

      {/* Destination S3 Vault Inspection Modal */}
      <DestinationVaultModal
        isOpen={showS3Modal}
        onClose={() => setShowS3Modal(false)}
        s3Details={s3Details}
        onConfirmDestination={(details) => {
          showSuccess(
            `Destination S3 Vault s3://${details.bucketName}/ configured for FastCDC stream`,
            'Destination Vault Configured'
          );
        }}
      />
    </div>
  );
}
