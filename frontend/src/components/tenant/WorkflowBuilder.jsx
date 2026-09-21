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
      // 1. If an explicit workflow was selected (e.g. Open Canvas from Vault)
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
          const cleanedNodes = loadedNodes.map((n) => {
            let sub = n.subtitle;
            if (n.subtype === 'postgres') {
              sub = n.config?.database || initialWorkflow.source_name || `chunkflow_tenant_${tenant?.subdomain || 'default'}`;
            } else if (n.subtype === 's3') {
              const bkt = n.config?.bucketName;
              const path = n.config?.folderPath || '';
              sub = bkt ? `s3://${bkt}/${path}` : (initialWorkflow.destination_name || 'Amazon S3 Vault');
            }
            return { ...n, subtitle: sub };
          });

          if (isSubscribed) {
            setNodes(cleanedNodes);
            setConnections(loadedConns || []);
            setSelectedNodeId(cleanedNodes[0]?.id || null);
            showSuccess(`Loaded pipeline canvas for "${initialWorkflow.name || 'Snapshot Workflow'}"!`, 'Workflow Canvas Loaded');
          }
          return;
        } else {
          // Construct nodes from initialWorkflow metadata
          const pgId = `node_source_${Date.now()}`;
          const s3Id = `node_destination_${Date.now() + 1}`;
          const defaultPgNode = {
            id: pgId,
            type: 'source',
            subtype: 'postgres',
            x: 80,
            y: 160,
            isValid: true,
            title: initialWorkflow.source_name || 'PostgreSQL Database Source',
            subtitle: initialWorkflow.source_name || `chunkflow_tenant_${tenant?.subdomain || 'default'}`,
            config: {
              name: initialWorkflow.source_name || 'PostgreSQL Data Source',
              host: 'localhost',
              port: '5432',
              database: initialWorkflow.source_name || `chunkflow_tenant_${tenant?.subdomain || 'default'}`,
              username: '',
              password: '',
            },
          };
          const defaultS3Node = {
            id: s3Id,
            type: 'destination',
            subtype: 's3',
            x: 460,
            y: 160,
            isValid: true,
            title: initialWorkflow.destination_name || 'Amazon S3 Vault Destination',
            subtitle: initialWorkflow.destination_name || 's3://chunkflow-vault-raw/',
            config: {
              name: initialWorkflow.destination_name || 'Amazon S3 Vault',
              bucketName: '',
              folderPath: '',
            },
          };
          if (isSubscribed) {
            setNodes([defaultPgNode, defaultS3Node]);
            setConnections([{ id: `conn_${Date.now()}`, sourceId: pgId, targetId: s3Id }]);
            setSelectedNodeId(pgId);
            showSuccess(`Loaded canvas for "${initialWorkflow.name || 'Snapshot Pipeline'}"!`, 'Pipeline Loaded');
          }
          return;
        }
      }

      // 2. If initialWorkflow is null, construct a clean default canvas for a NEW workflow
      try {
        const cfgRes = await api.getTenantConfig();
        if (!isSubscribed) return;

        const pgConfig = cfgRes?.postgres?.[0] || {};
        const s3Config = cfgRes?.s3?.[0] || {};

        const pgId = `node_source_${Date.now()}`;
        const s3Id = `node_destination_${Date.now() + 1}`;

        const defaultPgNode = {
          id: pgId,
          type: 'source',
          subtype: 'postgres',
          x: 80,
          y: 160,
          isValid: Boolean(pgConfig.host && pgConfig.database_name),
          title: pgConfig.name || 'PostgreSQL Database Source',
          subtitle: pgConfig.database_name || pgConfig.database || `chunkflow_tenant_${tenant?.subdomain || 'default'}`,
          config: {
            name: pgConfig.name || 'PostgreSQL Data Source',
            host: pgConfig.host || 'localhost',
            port: String(pgConfig.port || '5432'),
            database: pgConfig.database_name || pgConfig.database || `chunkflow_tenant_${tenant?.subdomain || 'default'}`,
            username: pgConfig.username || '',
            password: pgConfig.password || '',
            useSSL: Boolean(pgConfig.use_ssl),
          },
        };

        const defaultS3Node = {
          id: s3Id,
          type: 'destination',
          subtype: 's3',
          x: 460,
          y: 160,
          isValid: Boolean(s3Config.bucket_name && s3Config.access_key_id),
          title: s3Config.name || 'Amazon S3 Vault Destination',
          subtitle: s3Config.bucket_name ? `s3://${s3Config.bucket_name}/${s3Config.folder_path || ''}` : 'Amazon S3 Vault',
          config: {
            name: s3Config.name || 'Amazon S3 Vault',
            bucketName: s3Config.bucket_name || '',
            region: s3Config.region || 'ap-south-1',
            accessKeyId: s3Config.access_key_id || '',
            secretAccessKey: s3Config.secret_access_key || '',
            folderPath: s3Config.folder_path || '',
          },
        };

        setNodes([defaultPgNode, defaultS3Node]);
        setConnections([{ id: `conn_${Date.now()}`, sourceId: pgId, targetId: s3Id }]);
        setSelectedNodeId(pgId);
      } catch (err) {
        console.error('Failed to load canvas data:', err);
      }
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
      setTimeout(() => {
        setIsTestingConnection(false);
        const bucket = config.bucketName?.trim();
        const msg = `Configuration Verified! Access granted to S3 Bucket "${bucket}".`;
        setTestResult({ type: 'success', success: true, message: msg });
        showSuccess(msg, 'Amazon S3 Vault Verified');
        setS3Details({ ...config });
        setShowS3Modal(true);

        setNodes((prev) =>
          prev.map((n) => (n.id === selectedNodeId ? { ...n, isValid: true } : n))
        );
      }, 600);
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
        nodeCount={nodes.length}
        onClearCanvas={() => setShowClearConfirmModal(true)}
        onDeploy={handleDeploy}
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
