'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, addEdge,
  useEdgesState, useNodesState, useReactFlow, ReactFlowProvider,
  type Connection, type Edge, type Node, type NodeTypes,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  ArrowLeft, Save, Play, Pause, Loader2, Sparkles, Zap,
  Mail, MessageCircle, Timer, GitBranch, Shuffle, Tag, Tags,
  Layers, Square, ShoppingCart, UserPlus, Package, Eye,
  CreditCard, Clock, Gift, Check, X, Settings2, BarChart3,
  TrendingUp, ChevronRight, Plus, Trash2, AlertCircle,
} from 'lucide-react'
import {
  TriggerNode, ActionNode, WaitNode, ConditionNode, StopNode, SplitTestNode,
  TRIGGER_TYPES, ACTION_TYPES, LOGIC_TYPES, getNodeMeta,
} from '@/components/flow/FlowNodes'

/* ── ReactFlow node type registry ─────────────────────────── */

const NODE_TYPES: NodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  waitNode: WaitNode,
  conditionNode: ConditionNode,
  stopNode: StopNode,
  splitTestNode: SplitTestNode,
}

/* ── Map drag-type → reactflow type ──────────────────────── */

function getReactFlowType(dragType: string): string {
  if (TRIGGER_TYPES.find(t => t.type === dragType)) return 'triggerNode'
  if (dragType === 'wait') return 'waitNode'
  if (dragType === 'condition') return 'conditionNode'
  if (dragType === 'stop') return 'stopNode'
  if (dragType === 'split_test') return 'splitTestNode'
  return 'actionNode'
}

function createNodeData(dragType: string) {
  if (TRIGGER_TYPES.find(t => t.type === dragType)) {
    const meta = getNodeMeta(dragType)
    return { triggerType: dragType, label: meta.label, config: {}, stats: { entered: 0 } }
  }
  if (dragType === 'wait') return { delayAmount: 1, delayUnit: 'hours', stats: { waiting: 0 } }
  if (dragType === 'condition') return { condition: '', config: {}, stats: {} }
  if (dragType === 'stop') return { stats: { completed: 0 } }
  if (dragType === 'split_test') return { config: { aPercent: 50 }, stats: {} }
  const meta = getNodeMeta(dragType)
  return { actionType: dragType, label: meta.label, config: {}, stats: { processed: 0 } }
}

/* ── Edge default style ────────────────────────────────────── */

const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#b4c5ff', width: 16, height: 16 },
  style: { stroke: '#b4c5ff', strokeWidth: 1.5, opacity: 0.65 },
}

/* ── Condition panels ──────────────────────────────────────── */

const CONDITIONS = [
  { value: 'email_opened',    label: 'Mail açıldı mı?' },
  { value: 'purchased',       label: 'Satın aldı mı?' },
  { value: 'clicked',         label: 'Link tıkladı mı?' },
  { value: 'is_vip',          label: 'VIP müşteri mi?' },
  { value: 'total_spent_gt',  label: 'Toplam harcama >' },
  { value: 'order_count_gt',  label: 'Sipariş sayısı >' },
]

const DELAY_UNITS = [
  { value: 'minutes', label: 'Dakika' },
  { value: 'hours',   label: 'Saat' },
  { value: 'days',    label: 'Gün' },
]

/* ── Main builder (wrapped by ReactFlowProvider) ─────────── */

function Builder() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { screenToFlowPosition } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flowName, setFlowName] = useState('Yeni Otomasyon')
  const [flowStatus, setFlowStatus] = useState('draft')
  const [trigger, setTrigger] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [saved, setSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [stats, setStats] = useState({ sent: 0, opened: 0, converted: 0, revenue: 0 })

  /* ── Load flow data ─────────────────────────────────────── */

  useEffect(() => {
    if (!id || id === 'new') { setLoading(false); return }
    fetch(`/api/automations/${id}/flow`)
      .then(r => r.json())
      .then(data => {
        if (data.name) setFlowName(data.name)
        if (data.status) setFlowStatus(data.status)
        if (data.trigger) setTrigger(data.trigger)
        setStats({ sent: data.sent ?? 0, opened: data.opened ?? 0, converted: data.converted ?? 0, revenue: data.revenue ?? 0 })
        const fd = data.flowData ?? {}
        if (Array.isArray(fd.nodes) && fd.nodes.length > 0) {
          setNodes(fd.nodes)
          setEdges(fd.edges ?? [])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  /* ── Connect nodes ──────────────────────────────────────── */

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, ...DEFAULT_EDGE_OPTIONS }, eds))
  }, [setEdges])

  /* ── Drag & drop from panel ─────────────────────────────── */

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const dragType = event.dataTransfer.getData('application/reactflow')
    if (!dragType) return

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const rfType = getReactFlowType(dragType)
    const newNode: Node = {
      id: `${dragType}_${Date.now()}`,
      type: rfType,
      position,
      data: createNodeData(dragType),
    }

    setNodes(nds => [...nds, newNode])
    // Auto-set trigger from first trigger node
    if (rfType === 'triggerNode' && !trigger) setTrigger(dragType)
  }, [screenToFlowPosition, setNodes, trigger])

  /* ── Node selection ─────────────────────────────────────── */

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  /* ── Update selected node data ──────────────────────────── */

  function updateNodeData(nodeId: string, patch: Record<string, unknown>) {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...patch } } : prev)
  }

  function deleteNode(nodeId: string) {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  /* ── Save flow ──────────────────────────────────────────── */

  async function saveFlow() {
    setSaving(true)
    try {
      const body = {
        name: flowName,
        trigger,
        flowData: { nodes, edges },
        status: flowStatus === 'active' ? 'active' : 'draft',
      }

      if (id && id !== 'new') {
        await fetch(`/api/automations/${id}/flow`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        const res = await fetch('/api/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, steps: '[]' }),
        })
        const data = await res.json()
        if (data.id) router.replace(`/automations/${data.id}/builder`)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  /* ── Activate / pause ───────────────────────────────────── */

  async function toggleActivation() {
    setActivating(true)
    const newStatus = flowStatus === 'active' ? 'paused' : 'active'
    try {
      await saveFlow()
      if (id && id !== 'new') {
        await fetch(`/api/automations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      }
      setFlowStatus(newStatus)
    } finally {
      setActivating(false)
    }
  }

  /* ── Render ─────────────────────────────────────────────── */

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={28} color="#b4c5ff" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#8b95a8', marginTop: 12, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>Flow yükleniyor…</p>
      </div>
    </div>
  )

  const isActive = flowStatus === 'active'
  const convRate = stats.sent > 0 ? ((stats.converted / stats.sent) * 100).toFixed(1) : '0.0'

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', flexShrink: 0, gap: 12,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <button onClick={() => router.push('/automations')} style={{
            display: 'flex', alignItems: 'center', gap: 6, color: '#8b95a8', fontSize: 13,
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b95a8')}>
            <ArrowLeft size={15} /> Geri
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          {editingName ? (
            <input value={flowName} onChange={e => setFlowName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(180,197,255,0.3)',
                borderRadius: 8, padding: '4px 10px', color: '#e2e8f8', fontSize: 14, fontWeight: 700, outline: 'none',
              }} />
          ) : (
            <button onClick={() => setEditingName(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#e2e8f8', fontSize: 14, fontWeight: 700,
              padding: '4px 6px', borderRadius: 8,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {flowName}
            </button>
          )}
          {/* Status badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(139,149,168,0.12)',
            color: isActive ? '#10b981' : '#8b95a8',
            border: `1px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(139,149,168,0.2)'}`,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10b981' : '#8b95a8', display: 'inline-block', animation: isActive ? 'pulse 2s infinite' : 'none' }} />
            {isActive ? 'Aktif' : flowStatus === 'paused' ? 'Duraklatıldı' : 'Taslak'}
          </span>
        </div>

        {/* Center: stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {[
            { label: 'Girdi', value: stats.sent.toLocaleString('tr'), color: '#b4c5ff' },
            { label: 'Dönüşüm', value: `%${convRate}`, color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#8b95a8' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <button onClick={saveFlow} disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: saved ? '#10b981' : '#e2e8f8', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s',
            }}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
          <button onClick={toggleActivation} disabled={activating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
              borderRadius: 10, border: 'none',
              background: isActive ? 'rgba(251,191,36,0.15)' : 'rgba(180,197,255,1)',
              color: isActive ? '#fbbf24' : '#0a0a0f',
              cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
            }}>
            {activating ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : isActive ? <Pause size={13} /> : <Play size={13} />}
            {isActive ? 'Duraklat' : 'Aktifleştir'}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Left panel: node types ──────────────────────── */}
        <div style={{
          width: 240, borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
          background: 'rgba(10,10,15,0.97)', flexShrink: 0, padding: '12px 10px',
        }}>
          {[
            { title: 'Tetikleyiciler', types: TRIGGER_TYPES },
            { title: 'Aksiyonlar', types: ACTION_TYPES },
            { title: 'Logic', types: LOGIC_TYPES },
          ].map(group => (
            <div key={group.title} style={{ marginBottom: 16 }}>
              <p style={{
                margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: '#8b95a8',
                textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 6px',
              }}>{group.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.types.map(t => {
                  const Icon = t.icon
                  return (
                    <div key={t.type}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('application/reactflow', t.type)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                        borderRadius: 10, border: `1px solid ${t.border}`,
                        background: t.bg, cursor: 'grab', transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = `${t.bg.replace('0.10', '0.18').replace('0.12', '0.22')}`
                        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = t.bg
                        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                      }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: t.bg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color={t.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f8', lineHeight: 1.2 }}>{t.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Help text */}
          <div style={{ padding: '10px', borderRadius: 10, background: 'rgba(180,197,255,0.05)', border: '1px dashed rgba(180,197,255,0.15)', marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 10, color: '#8b95a8', lineHeight: 1.6, textAlign: 'center' }}>
              Node'ları canvas'a <br />sürükle bırak
            </p>
          </div>
        </div>

        {/* ── Canvas ─────────────────────────────────────────── */}
        <div ref={reactFlowWrapper} style={{ flex: 1, background: '#0a0a0f' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            minZoom={0.2}
            maxZoom={2}
            style={{ background: '#0a0a0f' }}
          >
            <Background
              color="rgba(180,197,255,0.07)"
              gap={32}
              variant={BackgroundVariant.Dots}
              size={1.5}
            />
            <Controls style={{
              background: 'rgba(16,18,28,0.9)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, overflow: 'hidden',
            }} />
            <MiniMap
              style={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}
              nodeColor={node => {
                if (node.type === 'triggerNode') return '#3b82f6'
                if (node.type === 'waitNode') return '#fbbf24'
                if (node.type === 'conditionNode') return '#fb923c'
                if (node.type === 'stopNode') return '#f87171'
                return '#b4c5ff'
              }}
              maskColor="rgba(10,10,15,0.7)"
            />

            {/* Empty state hint */}
            {nodes.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', pointerEvents: 'none', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(180,197,255,0.08)', border: '1px solid rgba(180,197,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={28} color="rgba(180,197,255,0.5)" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: 600, margin: 0 }}>Sol panelden node sürükle</p>
                <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, margin: 0 }}>Tetikleyici ile başla, aksiyonları bağla</p>
              </div>
            )}
          </ReactFlow>
        </div>

        {/* ── Right panel: node config ─────────────────────── */}
        {selectedNode && (
          <div style={{
            width: 300, borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
            background: 'rgba(10,10,15,0.97)', flexShrink: 0, padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                {(() => {
                  const meta = getNodeMeta(selectedNode.data.triggerType ?? selectedNode.data.actionType ?? selectedNode.type?.replace('Node', '') ?? '')
                  const Icon = meta.icon
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} color={meta.color} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#e2e8f8' }}>
                          {selectedNode.data.label ?? meta.label}
                        </p>
                        <p style={{ margin: 0, fontSize: 9, color: '#8b95a8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {selectedNode.type?.replace('Node', '').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#8b95a8', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Config fields based on node type */}
            <ConfigPanel node={selectedNode} onUpdate={updateNodeData} onDelete={deleteNode} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .react-flow__node { cursor: default }
        .react-flow__controls-button { background: rgba(16,18,28,0.9) !important; border-color: rgba(255,255,255,0.08) !important; fill: #8b95a8 !important }
        .react-flow__controls-button:hover { background: rgba(30,32,48,0.9) !important; fill: #e2e8f8 !important }
        .react-flow__edge-path { stroke: #b4c5ff !important }
        .react-flow__connection-line { stroke: #b4c5ff !important; opacity: 0.6 }
      `}</style>
    </div>
  )
}

/* ── Config panel per node type ──────────────────────────── */

function ConfigPanel({ node, onUpdate, onDelete }: {
  node: Node
  onUpdate: (id: string, patch: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const ispa = (field: string) => (value: string | number) => {
    if (node.type === 'conditionNode') onUpdate(node.id, { [field]: value })
    else if (node.type === 'waitNode') onUpdate(node.id, { [field]: value })
    else {
      onUpdate(node.id, { config: { ...node.data.config, [field]: value } })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Custom label */}
      <CfgField label="Etiket (opsiyonel)">
        <CfgInput value={node.data.label ?? ''} placeholder="Node adı…"
          onChange={v => onUpdate(node.id, { label: v })} />
      </CfgField>

      {/* Trigger node config */}
      {node.type === 'triggerNode' && (
        <CfgField label="Segment (opsiyonel)">
          <CfgInput value={node.data.config?.segment ?? ''} placeholder="Tüm müşteriler"
            onChange={v => onUpdate(node.id, { config: { ...node.data.config, segment: v } })} />
        </CfgField>
      )}

      {/* Action: email */}
      {node.type === 'actionNode' && node.data.actionType === 'send_email' && <>
        <CfgField label="E-posta Konusu">
          <CfgInput value={node.data.config?.subject ?? ''} placeholder="Konu başlığı…"
            onChange={v => onUpdate(node.id, { config: { ...node.data.config, subject: v } })} />
        </CfgField>
        <CfgField label="E-posta Metni">
          <CfgTextarea value={node.data.config?.body ?? ''} placeholder="E-posta içeriği… {{firstName}} kullanabilirsin"
            onChange={v => onUpdate(node.id, { config: { ...node.data.config, body: v } })} />
        </CfgField>
      </>}

      {/* Action: whatsapp */}
      {node.type === 'actionNode' && node.data.actionType === 'send_whatsapp' && (
        <CfgField label="WhatsApp Mesajı">
          <CfgTextarea value={node.data.config?.message ?? ''} placeholder="Mesaj… {{firstName}} kullanabilirsin"
            onChange={v => onUpdate(node.id, { config: { ...node.data.config, message: v } })} />
        </CfgField>
      )}

      {/* Action: tag */}
      {node.type === 'actionNode' && (node.data.actionType === 'add_tag' || node.data.actionType === 'remove_tag') && (
        <CfgField label="Etiket Adı">
          <CfgInput value={node.data.config?.tag ?? ''} placeholder="vip, aktif, kayip…"
            onChange={v => onUpdate(node.id, { config: { ...node.data.config, tag: v } })} />
        </CfgField>
      )}

      {/* Action: segment */}
      {node.type === 'actionNode' && node.data.actionType === 'move_segment' && (
        <CfgField label="Hedef Segment">
          <CfgInput value={node.data.config?.segment ?? ''} placeholder="Segment adı…"
            onChange={v => onUpdate(node.id, { config: { ...node.data.config, segment: v } })} />
        </CfgField>
      )}

      {/* Wait node config */}
      {node.type === 'waitNode' && <>
        <CfgField label="Bekleme Süresi">
          <CfgInput type="number" value={String(node.data.delayAmount ?? 1)} placeholder="1"
            onChange={v => onUpdate(node.id, { delayAmount: parseInt(v) || 1 })} />
        </CfgField>
        <CfgField label="Birim">
          <CfgSelect value={node.data.delayUnit ?? 'hours'}
            options={DELAY_UNITS}
            onChange={v => onUpdate(node.id, { delayUnit: v })} />
        </CfgField>
      </>}

      {/* Condition node config */}
      {node.type === 'conditionNode' && <>
        <CfgField label="Koşul">
          <CfgSelect value={node.data.condition ?? ''}
            options={[{ value: '', label: 'Koşul seç…' }, ...CONDITIONS]}
            onChange={v => onUpdate(node.id, { condition: v })} />
        </CfgField>
        {(node.data.condition === 'total_spent_gt' || node.data.condition === 'order_count_gt') && (
          <CfgField label="Değer">
            <CfgInput type="number" value={node.data.config?.value ?? ''} placeholder="0"
              onChange={v => onUpdate(node.id, { config: { ...node.data.config, value: v } })} />
          </CfgField>
        )}
        <div style={{ padding: '10px', borderRadius: 10, background: 'rgba(180,197,255,0.05)', border: '1px solid rgba(180,197,255,0.1)', fontSize: 11, color: '#8b95a8', lineHeight: 1.6 }}>
          Yeşil ok: Koşul sağlandı (Evet)<br />
          Kırmızı ok: Koşul sağlanmadı (Hayır)
        </div>
      </>}

      {/* Split test config */}
      {node.type === 'splitTestNode' && (
        <CfgField label={`A Grubu: %${node.data.config?.aPercent ?? 50}`}>
          <input type="range" min="10" max="90" value={node.data.config?.aPercent ?? 50}
            onChange={e => onUpdate(node.id, { config: { ...node.data.config, aPercent: parseInt(e.target.value) } })}
            style={{ width: '100%', accentColor: '#34d399' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8b95a8', marginTop: 4 }}>
            <span>A: %{node.data.config?.aPercent ?? 50}</span>
            <span>B: %{100 - (node.data.config?.aPercent ?? 50)}</span>
          </div>
        </CfgField>
      )}

      {/* Stats */}
      {(node.data.stats?.entered > 0 || node.data.stats?.processed > 0 || node.data.stats?.completed > 0) && (
        <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#8b95a8', textTransform: 'uppercase', letterSpacing: '1px' }}>Analitik</p>
          {node.data.stats?.entered !== undefined && <StatRow label="Girdi" value={node.data.stats.entered} color="#b4c5ff" />}
          {node.data.stats?.processed !== undefined && <StatRow label="İşlendi" value={node.data.stats.processed} color="#10b981" />}
          {node.data.stats?.completed !== undefined && <StatRow label="Tamamladı" value={node.data.stats.completed} color="#fbbf24" />}
          {node.data.stats?.waiting !== undefined && <StatRow label="Bekliyor" value={node.data.stats.waiting} color="#fb923c" />}
        </div>
      )}

      {/* Delete */}
      <button onClick={() => onDelete(node.id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)',
          background: 'rgba(248,113,113,0.06)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(248,113,113,0.12)' }}
        onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(248,113,113,0.06)' }}>
        <Trash2 size={13} /> Node'u Sil
      </button>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: '#8b95a8' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value.toLocaleString('tr')}</span>
    </div>
  )
}

/* ── Config field components ────────────────────────────── */

function CfgField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#8b95a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function CfgInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9, padding: '8px 11px', fontSize: 12, color: '#e2e8f8', outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(180,197,255,0.35)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
    />
  )
}

function CfgTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9, padding: '8px 11px', fontSize: 12, color: '#e2e8f8', outline: 'none',
        fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
        transition: 'border-color 0.15s',
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(180,197,255,0.35)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
    />
  )
}

function CfgSelect({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9, padding: '8px 11px', fontSize: 12, color: '#e2e8f8', outline: 'none',
        fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box',
      }}>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
    </select>
  )
}

/* ── Exported page with ReactFlowProvider ──────────────── */

export default function BuilderPage() {
  return (
    <ReactFlowProvider>
      <Builder />
    </ReactFlowProvider>
  )
}
