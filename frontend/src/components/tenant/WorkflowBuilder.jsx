import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import WorkflowHeader from './workflow/WorkflowHeader';
import NodeLibrarySidebar from './workflow/NodeLibrarySidebar';
import WorkflowCanvas from './workflow/WorkflowCanvas';
import NodeInspectorPanel from './workflow/NodeInspectorPanel';
import SourceTableModal from './workflow/SourceTableModal';
import DestinationVaultModal from './workflow/DestinationVaultModal';
import { savePostgresConfig, saveS3Config } from '../../services/connectionStorage';
import { api } from '../../services/api';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useWorkflowCanvas } from '../../hooks/useWorkflowCanvas';

export default function WorkflowBuilder({ tenant, onSaveWorkflow, initialWorkflow }) {
  const { errors, validatePostgres, validateS3, clearErrors, clearFieldError } = useFormValidation();
  const {
    canvasRef,
    nodes,
    setNodes,
    connections,
    setConnections,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    connectingSourceId,
    handleDragStartFromSidebar,
    handleDragOverCanvas,
    handleDropOnCanvas,
    createNode,
    handleDeleteNode,
    handleNodeMouseDown,
    handlePortClick,
    handleUpdateConfig,
  } = useWorkflowCanvas(tenant);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [dbDetails, setDbDetails] = useState(null);
  const [showS3Modal, setShowS3Modal] = useState(false);
  const [s3Details, setS3Details] = useState(null);
  const [showPgPassword, setShowPgPassword] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load workflow canvas data when initialWorkflow prop changes or fallback to clean tenant DB config
  useEffect(() => {
    let isSubscribed = true;

    async function loadCanvasData() {
      // 1. If an explicit workflow/connector was selected (e.g. Open Canvas from Vault) or loading default pipeline
      let loadedNodes = [];
      let loadedConns = [];

      if (initialWorkflow) {
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
          const cleanedNodes = loadedNodes.map((n) => {
            const nodeConfig = { ...(n.config || {}) };

            if (n.subtype === 'postgres') {
              if (!nodeConfig.name && initialWorkflow.source_name) {
                nodeConfig.name = initialWorkflow.source_name;
              }
              const sub = nodeConfig.database || `chunkflow_tenant_${tenant?.subdomain || 'default'}`;
              const title = nodeConfig.name || n.title || 'Source Database';
              return { ...n, title, subtitle: sub, config: nodeConfig };
            } else if (n.subtype === 's3') {
              if (!nodeConfig.name && initialWorkflow.destination_name) {
                nodeConfig.name = initialWorkflow.destination_name;
              }
              const bkt = nodeConfig.bucketName;
              const path = nodeConfig.folderPath || '';
              const sub = bkt ? `s3://${bkt}/${path}` : (initialWorkflow.destination_name || 's3://vault/');
              const title = nodeConfig.name || n.title || 'S3 Destination';
              return { ...n, title, subtitle: sub, config: nodeConfig };
            }

            return n;
          });

          if (isSubscribed) {
            setNodes(cleanedNodes);
            setConnections(loadedConns || []);
            setSelectedNodeId(cleanedNodes[0]?.id || null);
            showSuccess(`Loaded pipeline canvas for "${initialWorkflow.name || 'Workflow Pipeline'}"!`, 'Workflow Canvas Loaded');
          }
          return;
        }
      }

      // Fetch saved decrypted configurations for this connector / tenant
      let savedCfg = null;
      try {
        const cfgRes = await api.getCanvas(initialWorkflow?.id);
        if (cfgRes && cfgRes.nodes && cfgRes.nodes.length > 0) {
          savedCfg = cfgRes;
        }
      } catch (e) {
        console.error('Failed to fetch saved configuration:', e);
      }

      if (savedCfg && isSubscribed) {
        const pgId = `node_source_${Date.now()}`;
        const s3Id = `node_destination_${Date.now() + 1}`;

        // Extract from canvas nodes
        const pgCanvasNode = savedCfg.nodes.find(n => n.node?.sub_type === 'postgres' || n.subtype === 'postgres');
        const s3CanvasNode = savedCfg.nodes.find(n => n.node?.sub_type === 's3' || n.subtype === 's3');

        const srcData = pgCanvasNode?.config_data || {};
        const destData = s3CanvasNode?.config_data || {};

        const srcSubtype = pgCanvasNode?.node?.sub_type || 'postgres';
        const destSubtype = s3CanvasNode?.node?.sub_type || 's3';

        const srcTitle = srcData.name || pgCanvasNode?.node?.name || 'Source Database';
        const srcSub = srcData.database || srcData.database_name || `chunkflow_tenant_${tenant?.subdomain || 'default'}`;

        const destTitle = destData.name || s3CanvasNode?.node?.name || 'Amazon S3 Vault';
        const destBucket = destData.bucketName || destData.bucket_name || '';
        const destPath = destData.folderPath || destData.folder_path || '';
        const destSub = destBucket ? `s3://${destBucket}${destPath}` : 's3://vault/';

        const loadedPgNode = {
          id: pgId,
          type: 'source',
          subtype: srcSubtype,
          x: 80,
          y: 160,
          isValid: true,
          title: srcTitle,
          subtitle: srcSub,
          config: {
            name: srcData.name || '',
            host: srcData.host || 'localhost',
            port: srcData.port || '5432',
            database: srcData.database || srcData.database_name || `chunkflow_tenant_${tenant?.subdomain || 'default'}`,
            username: srcData.username || '',
            password: srcData.password || '',
            useSSL: srcData.useSSL ?? srcData.use_ssl ?? false,
            backupSchedule: srcData.backupSchedule || srcData.backup_schedule || '',
            retentionDays: srcData.retentionDays || srcData.retention_days || '',
            ...srcData,
          },
        };

        const loadedS3Node = {
          id: s3Id,
          type: 'destination',
          subtype: destSubtype,
          x: 460,
          y: 160,
          isValid: true,
          title: destTitle,
          subtitle: destSub,
          config: {
            name: destData.name || '',
            bucketName: destBucket,
            region: destData.region || 'us-east-1',
            accessKeyId: destData.accessKeyId || destData.access_key_id || '',
            secretAccessKey: destData.secretAccessKey || destData.secret_access_key || '',
            folderPath: destPath,
            encryption: destData.encryption || 'AES-256 Server-Side Encryption',
            storageClass: destData.storage_class || destData.storageClass || 'Standard',
            ...destData,
          },
        };

        setNodes(savedCfg.nodes.map(n => ({
          id: n.element_id,
          type: n.node?.category || 'transform',
          subtype: n.node?.sub_type,
          x: n.position_x,
          y: n.position_y,
          isValid: n.is_verified,
          title: n.label,
          subtitle: '',
          config: n.config_data || {}
        })));
        setConnections(savedCfg.connections.map(c => {
          const srcNode = savedCfg.nodes.find(n => n.id === c.source_canvas_node_id);
          const tgtNode = savedCfg.nodes.find(n => n.id === c.target_canvas_node_id);
          return {
            id: c.id,
            sourceId: srcNode ? srcNode.element_id : c.source_canvas_node_id,
            targetId: tgtNode ? tgtNode.element_id : c.target_canvas_node_id
          };
        }));
        if (savedCfg.nodes.length > 0) {
          setSelectedNodeId(savedCfg.nodes[0].element_id);
        }
        showSuccess(`Loaded canvas and populated decrypted configuration for "${initialWorkflow?.name || 'Connector Pipeline'}"!`, 'Pipeline Loaded');
        return;
      }

      // If initialWorkflow and savedCfg are both null, show clean empty canvas
      if (!isSubscribed) return;
      setNodes([]);
      setConnections([]);
      setSelectedNodeId(null);
    }

    loadCanvasData();

    return () => {
      isSubscribed = false;
    };
  }, [initialWorkflow, tenant?.subdomain]);

  // Reset test connection result and clear validation errors on node selection change
  useEffect(() => {
    setTestResult(null);
    clearErrors();
  }, [selectedNodeId]);

  const handleSaveConfig = async () => {
    if (!selectedNodeId || !selectedNode) return;

    let isValid = true;
    if (selectedNode.subtype === 'postgres') {
      isValid = validatePostgres(selectedNode.config);
    } else if (selectedNode.subtype === 's3') {
      isValid = validateS3(selectedNode.config);
    }

    if (!isValid) return;

    if (selectedNode.subtype === 'postgres') {
      savePostgresConfig(selectedNode.config);
    } else if (selectedNode.subtype === 's3') {
      saveS3Config(selectedNode.config);
    }

    const resTypes = await fetch(`${import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1'}/nodes?subdomain=${encodeURIComponent(tenant?.subdomain || 'willsparrow')}`);
    const typesData = await resTypes.json();
    const nodeTypes = typesData.data || [];

    const payloadNodes = nodes.map(n => ({
      connector_id: initialWorkflow?.id || 'default_connector',
      node_id: n.nodeDbId || nodeTypes.find(t => t.sub_type === n.subtype)?.id,
      element_id: n.id,
      label: n.title,
      position_x: n.x,
      position_y: n.y,
      config_data: n.config,
      is_verified: n.isValid || true
    }));

    const payloadConns = connections.map(c => ({
      connector_id: initialWorkflow?.id || 'default_connector',
      source_canvas_node_id: c.sourceId,
      target_canvas_node_id: c.targetId
    }));

    const result = await api.saveCanvas({
      connector_id: initialWorkflow?.id || 'default_connector',
      nodes: payloadNodes,
      connections: payloadConns
    });

    if (!result.success) {
      showError(result.message || 'Failed to save configuration to database.', 'DB Save Failed');
      return;
    }

    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, isValid: true } : n))
    );
    showSuccess('Node configuration saved to tenant database!', 'Config Saved');
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
          setTestResult({ type: 'success', success: true, message: msg });
          showSuccess(msg, 'PostgreSQL Connection Verified');
          setDbDetails(res);
          setShowSourceModal(true);

          setNodes((prev) =>
            prev.map((n) => (n.id === selectedNodeId ? { ...n, isValid: true } : n))
          );
        } else {
          const msg = res?.message || 'PostgreSQL Connection Failed.';
          setTestResult({ type: 'error', success: false, message: msg });
          showError(msg, 'PostgreSQL Connection Failed');
        }
      } catch (err) {
        setIsTestingConnection(false);
        const msg = err.message || 'Failed to trigger PostgreSQL connection test via Go Backend.';
        setTestResult({ type: 'error', success: false, message: msg });
        showError(msg, 'Connection Test Failed');
      }
    } else if (selectedNode.subtype === 's3') {
      try {
        const res = await api.testS3Connection(config);
        setIsTestingConnection(false);
        if (res && res.success) {
          const msg = res.message || `Configuration Verified! Access granted to S3 Bucket.`;
          setTestResult({ type: 'success', success: true, message: msg });
          showSuccess(msg, 'Amazon S3 Vault Verified');
          setS3Details({ ...config });
          setShowS3Modal(true);

          setNodes((prev) =>
            prev.map((n) => (n.id === selectedNodeId ? { ...n, isValid: true } : n))
          );
        } else {
          const msg = res?.message || 'S3 Connection Failed.';
          setTestResult({ type: 'error', success: false, message: msg });
          showError(msg, 'S3 Connection Failed');
        }
      } catch (err) {
        setIsTestingConnection(false);
        const msg = err.message || 'Failed to trigger S3 connection test via Go Backend.';
        setTestResult({ type: 'error', success: false, message: msg });
        showError(msg, 'Connection Test Failed');
      }
    }
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

    // 1. Force a save of the entire canvas (Nodes & Connections) to the new DB schema
    const resTypes = await fetch(`${import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1'}/nodes?subdomain=${encodeURIComponent(tenant?.subdomain || 'willsparrow')}`);
    const typesData = await resTypes.json();
    const nodeTypes = typesData.data || [];

    const payloadNodes = nodes.map(n => ({
      connector_id: initialWorkflow?.id || 'default_connector',
      node_id: n.nodeDbId || nodeTypes.find(t => t.sub_type === n.subtype)?.id,
      element_id: n.id,
      label: n.title,
      position_x: n.x,
      position_y: n.y,
      config_data: n.config,
      is_verified: n.isValid || true
    }));

    const payloadConns = connections.map(c => ({
      connector_id: initialWorkflow?.id || 'default_connector',
      source_canvas_node_id: c.sourceId,
      target_canvas_node_id: c.targetId
    }));

    await api.saveCanvas({
      connector_id: initialWorkflow?.id || 'default_connector',
      nodes: payloadNodes,
      connections: payloadConns
    });

    // 2. Trigger FastCDC Deployment
    const postgresNode = nodes.find((n) => n.subtype === 'postgres');
    const s3Node = nodes.find((n) => n.subtype === 's3');

    const res = await api.deployWorkflow({
      workflowName: postgresNode?.config?.name || 'PostgreSQL -> S3 Vault Data Pipeline',
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

  const executeClearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
  };

  const handleCloseInspector = () => {
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
        nodes={nodes}
        connections={connections}
        onClearCanvas={() => setShowClearConfirmModal(true)}
        onDeploy={handleDeploy}
        initialWorkflow={initialWorkflow}
      />

      {/* 2. Main Workspace 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[500px] lg:min-h-0 overflow-hidden">
        {/* Left Sidebar: Node Library */}
        <NodeLibrarySidebar
          onDragStart={handleDragStartFromSidebar}
          onCreateNode={createNode}
        />

        {/* Center: Visual Workflow Canvas */}
        <WorkflowCanvas
          canvasRef={canvasRef}
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          connectingSourceId={connectingSourceId}
          onDragOverCanvas={handleDragOverCanvas}
          onDropCanvas={handleDropOnCanvas}
          onMouseMoveCanvas={() => {}}
          onMouseUpCanvas={() => {}}
          onNodeMouseDown={handleNodeMouseDown}
          onPortClick={handlePortClick}
          onDeleteNode={handleDeleteNode}
          onCreateNode={createNode}
        />

        {/* Right Sidebar: Node Inspector Panel */}
        <NodeInspectorPanel
          selectedNode={selectedNode}
          selectedNodeId={selectedNodeId}
          onCloseInspector={handleCloseInspector}
          onUpdateConfig={(key, val) => handleUpdateConfig(key, val, clearFieldError)}
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

      {/* Confirmation Modal for Clear Canvas */}
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

      {/* Source Database Schema Modal */}
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
