
import { useMemo, useRef, useState } from 'react'
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  FolderOpen,
  GitBranch,
  Plus,
  Save,
  Trash2,
  Workflow,
  X,
} from 'lucide-react'

import {
  activityRegistry,
  type ActivityDefinition,
} from '../../engine/activities/activityRegistry'

import {
  createEmptyWorkflow,
  createNodeId,
} from '../../engine/workflow/defaultWorkflow'

import {
  validateWorkflow,
} from '../../engine/workflow/validateWorkflow'

import {
  deleteWorkflow,
  downloadWorkflowJson,
  listWorkflows,
  loadWorkflow,
  parseWorkflowJson,
  saveWorkflow,
} from '../../engine/workflow/workflowStorage'

import {
  addVariable,
  createVariable,
} from '../../engine/variables/variableManager'

import type {
  JsonValue,
  WorkflowDocument,
  WorkflowNode,
  WorkflowVariableType,
} from '../../types/workflow'

type CanvasNode = Node<Record<string, JsonValue>>

const initialWorkflow = createEmptyWorkflow('My First Automation')

function toCanvasNodes(
  workflowNodes: WorkflowNode[],
): CanvasNode[] {
  return workflowNodes.map((node) => ({
    id: node.id,
    type: 'default',
    position: node.position,
    data: {
      ...node.data,
      activityType: node.type,
      label:
        typeof node.data.label === 'string'
          ? node.data.label
          : node.type,
    },
    draggable: true,
  }))
}

function toWorkflowNodes(
  nodes: CanvasNode[],
): WorkflowNode[] {
  return nodes.map((node) => {
    const data = { ...node.data }
    const activityType =
      typeof data.activityType === 'string'
        ? data.activityType
        : 'unknown'

    delete data.activityType

    return {
      id: node.id,
      type: activityType,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
      data,
    }
  })
}

function createCanvasEdges(
  workflow: WorkflowDocument,
): Edge[] {
  return workflow.edges.map((edge) => ({
    ...edge,
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
  }))
}

function createWorkflowFromCanvas(
  workflow: WorkflowDocument,
  nodes: CanvasNode[],
  edges: Edge[],
): WorkflowDocument {
  return {
    ...workflow,
    metadata: {
      ...workflow.metadata,
      updatedAt: new Date().toISOString(),
    },
    nodes: toWorkflowNodes(nodes),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label:
        typeof edge.label === 'string'
          ? edge.label
          : undefined,
      type: edge.type,
      animated: edge.animated,
    })),
  }
}

const panelStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: 14,
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '8px 11px',
  border: '1px solid #e2e8f0',
  borderRadius: 7,
  background: '#ffffff',
  color: '#334155',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  fontSize: 13,
  outline: 'none',
  color: '#1e293b',
  background: '#ffffff',
}

const smallLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#64748b',
  fontSize: 11,
  fontWeight: 700,
}

export default function Designer() {
  const [workflow, setWorkflow] =
    useState<WorkflowDocument>(initialWorkflow)

  const [nodes, setNodes, onNodesChange] =
    useNodesState<CanvasNode>(toCanvasNodes(initialWorkflow.nodes))

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(createCanvasEdges(initialWorkflow))

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>(null)

  const [nodeDataText, setNodeDataText] =
    useState('{\n  "label": "Activity"\n}')

  const [workflowName, setWorkflowName] =
    useState(initialWorkflow.metadata.name)

  const [savedWorkflows, setSavedWorkflows] =
    useState<WorkflowDocument[]>([])

  const [showLibrary, setShowLibrary] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const [variableName, setVariableName] = useState('')
  const [variableType, setVariableType] =
    useState<WorkflowVariableType>('string')
  const [variableValue, setVariableValue] = useState('')

  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] =
    useState<'success' | 'error' | 'info'>('info')

  const importInputRef = useRef<HTMLInputElement>(null)

  const selectedNode = nodes.find(
    (node) => node.id === selectedNodeId,
  )

  const currentWorkflow = useMemo(
    () => createWorkflowFromCanvas(workflow, nodes, edges),
    [workflow, nodes, edges],
  )

  const validation = useMemo(
    () => validateWorkflow(currentWorkflow),
    [currentWorkflow],
  )

  const notify = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setNotice(message)
    setNoticeType(type)
  }

  const updateWorkflowName = (value: string) => {
    setWorkflowName(value)

    setWorkflow((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        name: value,
      },
    }))
  }

  const addActivity = (activity: ActivityDefinition) => {
    if (activity.type === 'start' || activity.type === 'end') {
      notify(
        'Start and End nodes are already provided in the workflow.',
        'info',
      )
      return
    }

    const nodeId = createNodeId(activity.type)

    const newNode: CanvasNode = {
      id: nodeId,
      type: 'default',
      position: {
        x: 180 + Math.random() * 250,
        y: 120 + Math.random() * 260,
      },
      data: {
        label: activity.label,
        activityType: activity.type,
      },
    }

    setNodes((current) => [...current, newNode])
    setSelectedNodeId(nodeId)

    setNodeDataText(
      JSON.stringify(
        {
          label: activity.label,
          ...Object.fromEntries(
            activity.inputs
              .filter((input) => input.defaultValue !== undefined)
              .map((input) => [
                input.name,
                input.defaultValue as JsonValue,
              ]),
          ),
        },
        null,
        2,
      ),
    )

    notify(`${activity.label} activity added.`, 'success')
  }

  const handleConnect = (connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          id: createNodeId('edge'),
          type: 'smoothstep',
          animated: true,
        },
        current,
      ),
    )
  }

  const handleNodeClick = (
    _event: React.MouseEvent,
    node: CanvasNode,
  ) => {
    setSelectedNodeId(node.id)
    setNodeDataText(
      JSON.stringify(node.data, null, 2),
    )
  }

  const updateSelectedNode = () => {
    if (!selectedNodeId) return

    try {
      const parsed: unknown = JSON.parse(nodeDataText)

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error('Node properties must be a JSON object.')
      }

      const data = parsed as Record<string, JsonValue>

      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNodeId
            ? { ...node, data }
            : node,
        ),
      )

      notify('Activity properties updated.', 'success')
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Invalid node properties JSON.',
        'error',
      )
    }
  }

  const removeSelectedNode = () => {
    if (!selectedNodeId) return

    const node = nodes.find(
      (item) => item.id === selectedNodeId,
    )

    if (!node) return

    const activityType =
      typeof node.data.activityType === 'string'
        ? node.data.activityType
        : ''

    if (activityType === 'start' || activityType === 'end') {
      notify('Start and End nodes cannot be deleted.', 'error')
      return
    }

    setNodes((current) =>
      current.filter((item) => item.id !== selectedNodeId),
    )

    setEdges((current) =>
      current.filter(
        (edge) =>
          edge.source !== selectedNodeId &&
          edge.target !== selectedNodeId,
      ),
    )

    setSelectedNodeId(null)
    notify('Activity removed.', 'success')
  }

  const handleSave = () => {
    const result = saveWorkflow(currentWorkflow)

    if (!result.success || !result.data) {
      notify(result.error || 'Unable to save workflow.', 'error')
      return
    }

    setWorkflow(result.data)
    setWorkflowName(result.data.metadata.name)
    setSavedWorkflows(listWorkflows())

    notify('Workflow saved in this browser.', 'success')
  }

  const openLibrary = () => {
    setSavedWorkflows(listWorkflows())
    setShowLibrary(true)
  }

  const openWorkflow = (id: string) => {
    const result = loadWorkflow(id)

    if (!result.success || !result.data) {
      notify(result.error || 'Unable to open workflow.', 'error')
      return
    }

    const next = result.data

    setWorkflow(next)
    setWorkflowName(next.metadata.name)
    setNodes(toCanvasNodes(next.nodes))
    setEdges(createCanvasEdges(next))
    setSelectedNodeId(null)
    setShowLibrary(false)

    notify('Workflow loaded.', 'success')
  }

  const removeWorkflowFromLibrary = (id: string) => {
    const result = deleteWorkflow(id)

    if (!result.success) {
      notify(result.error || 'Unable to delete workflow.', 'error')
      return
    }

    setSavedWorkflows(listWorkflows())
    notify('Workflow deleted from this browser.', 'success')
  }

  const handleNewWorkflow = () => {
    const next = createEmptyWorkflow('Untitled Workflow')

    setWorkflow(next)
    setWorkflowName(next.metadata.name)
    setNodes(toCanvasNodes(next.nodes))
    setEdges(createCanvasEdges(next))
    setSelectedNodeId(null)

    notify('New workflow created.', 'success')
  }

  const handleExport = () => {
    const result = downloadWorkflowJson(currentWorkflow)

    if (!result.success) {
      notify(result.error || 'Export failed.', 'error')
      return
    }

    notify('Workflow JSON exported.', 'success')
  }

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Import file exceeds the 5 MB limit.')
      }

      const content = await file.text()
      const result = parseWorkflowJson(content)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid workflow file.')
      }

      const next = result.data

      setWorkflow(next)
      setWorkflowName(next.metadata.name)
      setNodes(toCanvasNodes(next.nodes))
      setEdges(createCanvasEdges(next))
      setSelectedNodeId(null)

      notify('Workflow imported successfully.', 'success')
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Unable to import workflow.',
        'error',
      )
    }
  }

  const handleAddVariable = () => {
    if (!variableName.trim()) {
      notify('Variable name is required.', 'error')
      return
    }

    let parsedValue: JsonValue = variableValue

    try {
      if (variableType === 'number') {
        parsedValue = Number(variableValue)

        if (!Number.isFinite(parsedValue)) {
          throw new Error('Enter a valid number.')
        }
      } else if (variableType === 'boolean') {
        if (!['true', 'false'].includes(variableValue)) {
          throw new Error('Boolean value must be true or false.')
        }

        parsedValue = variableValue === 'true'
      } else if (
        variableType === 'object' ||
        variableType === 'array'
      ) {
        parsedValue = JSON.parse(variableValue) as JsonValue
      }

      const variable = createVariable(
        variableName,
        variableType,
        parsedValue,
      )

      const nextVariables = addVariable(
        currentWorkflow.variables,
        variable,
      )

      setWorkflow((current) => ({
        ...current,
        variables: nextVariables,
      }))

      setVariableName('')
      setVariableValue('')

      notify('Variable added.', 'success')
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Unable to add variable.',
        'error',
      )
    }
  }

  const removeWorkflowVariable = (id: string) => {
    setWorkflow((current) => ({
      ...current,
      variables: current.variables.filter(
        (variable) => variable.id !== id,
      ),
    }))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 145px)',
        minHeight: 650,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Workflow toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '12px 16px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 9,
              background: '#eff6ff',
              color: '#2563eb',
            }}
          >
            <Workflow size={19} />
          </div>

          <div>
            <input
              value={workflowName}
              onChange={(event) =>
                updateWorkflowName(event.target.value)
              }
              aria-label="Workflow name"
              style={{
                border: 0,
                outline: 0,
                width: 220,
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
              }}
            />
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              Schema v{workflow.schemaVersion} · {nodes.length} activities
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <button style={buttonStyle} onClick={handleNewWorkflow}>
            <Plus size={14} /> New
          </button>

          <button style={buttonStyle} onClick={openLibrary}>
            <FolderOpen size={14} /> Open
          </button>

          <button style={buttonStyle} onClick={handleExport}>
            <ArrowDownToLine size={14} /> Export
          </button>

          <button
            style={buttonStyle}
            onClick={() => importInputRef.current?.click()}
          >
            <ArrowUpFromLine size={14} /> Import
          </button>

          <button
            style={{
              ...buttonStyle,
              background: '#2563eb',
              color: '#ffffff',
              borderColor: '#2563eb',
            }}
            onClick={handleSave}
          >
            <Save size={14} /> Save
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Main workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '210px minmax(0, 1fr) 260px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Activity library */}
        <aside
          style={{
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: 12,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            ACTIVITY LIBRARY
          </div>

          {(
            [
              'logic',
              'browser',
              'desktop',
              'data',
              'file',
              'system',
              'ai',
            ] as const
          ).map((category) => {
            const items = activityRegistry.filter(
              (activity) => activity.category === category,
            )

            if (!items.length) return null

            return (
              <div key={category} style={{ marginBottom: 15 }}>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    color: '#94a3b8',
                    marginBottom: 7,
                  }}
                >
                  {category}
                </div>

                <div style={{ display: 'grid', gap: 5 }}>
                  {items.map((activity) => (
                    <button
                      key={activity.type}
                      onClick={() => addActivity(activity)}
                      title={activity.description}
                      style={{
                        ...buttonStyle,
                        justifyContent: 'flex-start',
                        width: '100%',
                        padding: '8px 9px',
                        fontWeight: 600,
                      }}
                    >
                      <Plus size={12} color="#2563eb" />
                      {activity.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </aside>

        {/* Workflow canvas */}
        <main style={{ minWidth: 0, minHeight: 0, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              zIndex: 5,
              top: 12,
              left: 12,
              display: 'flex',
              gap: 7,
            }}
          >
            <button
              style={buttonStyle}
              onClick={() => setShowVariables(true)}
            >
              <Activity size={13} /> Variables ({workflow.variables.length})
            </button>

            <button
              style={buttonStyle}
              onClick={() => setShowValidation(true)}
            >
              <GitBranch size={13} /> Validate
              {validation.errors.length > 0 && (
                <span style={{ color: '#dc2626' }}>
                  {validation.errors.length}
                </span>
              )}
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1}
              color="#cbd5e1"
            />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          </ReactFlow>
        </main>

        {/* Properties inspector */}
        <aside
          style={{
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            padding: 14,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: 1,
              marginBottom: 15,
            }}
          >
            PROPERTIES INSPECTOR
          </div>

          {selectedNode ? (
            <>
              <div style={{ marginBottom: 15 }}>
                <div style={smallLabelStyle}>ACTIVITY ID</div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedNode.id}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={smallLabelStyle}>
                  ACTIVITY TYPE
                </label>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {String(selectedNode.data.activityType || 'unknown')}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={smallLabelStyle}>
                  NODE DATA (JSON)
                </label>

                <textarea
                  value={nodeDataText}
                  onChange={(event) =>
                    setNodeDataText(event.target.value)
                  }
                  spellCheck={false}
                  style={{
                    ...inputStyle,
                    minHeight: 230,
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                />
              </div>

              <button
                style={{
                  ...buttonStyle,
                  width: '100%',
                  background: '#2563eb',
                  borderColor: '#2563eb',
                  color: '#ffffff',
                  marginBottom: 8,
                }}
                onClick={updateSelectedNode}
              >
                <Check size={14} /> Apply Properties
              </button>

              <button
                style={{
                  ...buttonStyle,
                  width: '100%',
                  color: '#dc2626',
                  borderColor: '#fecaca',
                }}
                onClick={removeSelectedNode}
              >
                <Trash2 size={14} /> Delete Activity
              </button>
            </>
          ) : (
            <div
              style={{
                padding: 18,
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              <Workflow
                size={28}
                style={{ margin: '0 auto 10px' }}
              />
              Select an activity on the canvas to edit its properties.
            </div>
          )}

          <div
            style={{
              ...panelStyle,
              marginTop: 18,
              background: '#f8fafc',
            }}
          >
            <div style={smallLabelStyle}>WORKFLOW STATUS</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                color: validation.valid ? '#059669' : '#dc2626',
              }}
            >
              {validation.valid
                ? <Check size={14} />
                : <AlertCircle size={14} />}
              {validation.valid
                ? 'Validation passed'
                : `${validation.errors.length} validation errors`}
            </div>
            <div
              style={{
                marginTop: 7,
                color: '#64748b',
                fontSize: 10,
              }}
            >
              {validation.warnings.length} warnings
            </div>
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 14px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          fontSize: 10,
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', gap: 14 }}>
          <span>{nodes.length} Nodes</span>
          <span>{edges.length} Connections</span>
          <span>{workflow.variables.length} Variables</span>
        </div>
        <span>Workflow Schema {workflow.schemaVersion}</span>
      </div>

      {/* Notification */}
      {notice && (
        <div
          role="status"
          style={{
            position: 'fixed',
            zIndex: 100,
            right: 24,
            bottom: 24,
            maxWidth: 380,
            padding: '12px 16px',
            borderRadius: 9,
            color:
              noticeType === 'error'
                ? '#991b1b'
                : noticeType === 'success'
                  ? '#065f46'
                  : '#1e40af',
            background:
              noticeType === 'error'
                ? '#fee2e2'
                : noticeType === 'success'
                  ? '#d1fae5'
                  : '#dbeafe',
            boxShadow: '0 8px 24px rgba(15,23,42,.12)',
            fontSize: 12,
          }}
        >
          {notice}
          <button
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
            style={{
              marginLeft: 12,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Workflow library modal */}
      {showLibrary && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <strong>Workflow Library</strong>
              <button
                style={buttonStyle}
                onClick={() => setShowLibrary(false)}
              >
                <X size={15} />
              </button>
            </div>

            {savedWorkflows.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                No saved workflows in this browser yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {savedWorkflows.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...panelStyle,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {item.metadata.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {item.nodes.length} nodes · Updated{' '}
                        {new Date(item.metadata.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={buttonStyle}
                        onClick={() => openWorkflow(item.id)}
                      >
                        <FolderOpen size={13} /> Open
                      </button>
                      <button
                        style={{ ...buttonStyle, color: '#dc2626' }}
                        onClick={() => removeWorkflowFromLibrary(item.id)}
                        aria-label={`Delete ${item.metadata.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variables modal */}
      {showVariables && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <strong>Workflow Variables</strong>
              <button
                style={buttonStyle}
                onClick={() => setShowVariables(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 1fr auto',
                gap: 7,
                marginBottom: 16,
              }}
            >
              <input
                style={inputStyle}
                placeholder="Variable name"
                value={variableName}
                onChange={(event) => setVariableName(event.target.value)}
              />

              <select
                style={inputStyle}
                value={variableType}
                onChange={(event) =>
                  setVariableType(
                    event.target.value as WorkflowVariableType,
                  )
                }
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>

              <input
                style={inputStyle}
                placeholder="Value / JSON"
                value={variableValue}
                onChange={(event) => setVariableValue(event.target.value)}
              />

              <button
                style={{
                  ...buttonStyle,
                  background: '#2563eb',
                  color: '#ffffff',
                }}
                onClick={handleAddVariable}
              >
                <Plus size={13} />
              </button>
            </div>

            {workflow.variables.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 12 }}>
                No variables defined.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 7 }}>
                {workflow.variables.map((variable) => (
                  <div
                    key={variable.id}
                    style={{
                      ...panelStyle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 12 }}>
                        {variable.name}
                      </strong>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {variable.type} · {JSON.stringify(variable.value)}
                      </div>
                    </div>
                    <button
                      style={{ ...buttonStyle, color: '#dc2626' }}
                      onClick={() => removeWorkflowVariable(variable.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation modal */}
      {showValidation && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <strong>Workflow Validation</strong>
              <button
                style={buttonStyle}
                onClick={() => setShowValidation(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div
              style={{
                ...panelStyle,
                marginBottom: 12,
                color: validation.valid ? '#047857' : '#b91c1c',
              }}
            >
              <strong>
                {validation.valid
                  ? 'Workflow structure is valid.'
                  : 'Workflow contains validation errors.'}
              </strong>
            </div>

            {[
              ...validation.errors,
              ...validation.warnings,
              ...validation.infos,
            ].length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 12 }}>
                No issues found.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ...validation.errors,
                  ...validation.warnings,
                  ...validation.infos,
                ].map((issue, index) => (
                  <div
                    key={`${issue.code}-${index}`}
                    style={{
                      ...panelStyle,
                      borderColor:
                        issue.severity === 'error'
                          ? '#fecaca'
                          : issue.severity === 'warning'
                            ? '#fde68a'
                            : '#bfdbfe',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color:
                          issue.severity === 'error'
                            ? '#dc2626'
                            : issue.severity === 'warning'
                              ? '#b45309'
                              : '#2563eb',
                      }}
                    >
                      {issue.severity} · {issue.code}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      {issue.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 90,
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  background: 'rgba(15,23,42,.42)',
}

const modalStyle: React.CSSProperties = {
  width: 'min(760px, 100%)',
  maxHeight: '85vh',
  overflowY: 'auto',
  padding: 20,
  borderRadius: 14,
  background: '#ffffff',
  boxShadow: '0 20px 60px rgba(15,23,42,.2)',
}

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 18,
  color: '#0f172a',
  fontSize: 15,
}
