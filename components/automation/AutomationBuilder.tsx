'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  addEdge, useEdgesState, useNodesState, useReactFlow,
  type Connection, type Node, type Edge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  ArrowLeft, Save, Play, Pause, Check, Loader2, Zap,
  ChevronRight, LayoutGrid, Pencil, AlertCircle, X,
  Undo2, Redo2, FlaskConical, Rocket, Clock, Copy,
} from 'lucide-react'

import BlockLibrary from './BlockLibrary'
import PropertiesPanel from './PropertiesPanel'
import { NODE_TYPES, getReactFlowType, buildNodeData, getNodeMeta, TRIGGER_NODE_TYPES } from './AutomationNodes'

/* ─────────────────────────────────────────────────────────────
   EDGE DEFAULTS
───────────────────────────────────────────────────────────── */

const EDGE_OPTIONS = {
  type: 'smoothstep',
  animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 14, height: 14 },
  style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.45 },
}

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────────── */

const STATUS_CFG = {
  active:  { label: 'Aktif',        dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  paused:  { label: 'Duraklatıldı', dot: '#f59e0b', bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  draft:   { label: 'Taslak',       dot: '#9ca3af', bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
} as const

/* ─────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────── */

type Toast = { type: 'success' | 'error'; msg: string }

function ToastBar({ t, onClose }: { t: Toast; onClose: () => void }) {
  useEffect(() => { const id = setTimeout(onClose, 3500); return () => clearTimeout(id) }, [onClose])
  const isErr = t.type === 'error'
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 18px 11px 14px', borderRadius: 12,
      background: isErr ? '#fff1f1' : '#f0fdf4',
      border: `1.5px solid ${isErr ? '#fca5a5' : '#86efac'}`,
      boxShadow: '0 8px 30px rgba(0,0,0,0.14)', minWidth: 280, maxWidth: 460,
      animation: 'toastUp 0.22s cubic-bezier(.34,1.56,.64,1)',
    }}>
      {isErr ? <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
             : <Check size={15} color="#16a34a" style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: isErr ? '#991b1b' : '#15803d' }}>{t.msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: isErr ? '#dc2626' : '#16a34a' }}>
        <X size={12} />
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   HISTORY HOOK
───────────────────────────────────────────────────────────── */

type Snapshot = { nodes: Node[]; edges: Edge[] }

function useHistory(setNodes: (n: Node[]) => void, setEdges: (e: Edge[]) => void) {
  const stack = useRef<Snapshot[]>([])
  const idx   = useRef<number>(-1)

  function snap(nodes: Node[], edges: Edge[]) {
    stack.current = stack.current.slice(0, idx.current + 1)
    stack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) })
    if (stack.current.length > 40) stack.current.shift()
    idx.current = stack.current.length - 1
  }

  function undo() {
    if (idx.current <= 0) return
    idx.current--
    const s = stack.current[idx.current]
    setNodes(s.nodes); setEdges(s.edges)
  }

  function redo() {
    if (idx.current >= stack.current.length - 1) return
    idx.current++
    const s = stack.current[idx.current]
    setNodes(s.nodes); setEdges(s.edges)
  }

  const canUndo = () => idx.current > 0
  const canRedo = () => idx.current < stack.current.length - 1
  return { snap, undo, redo, canUndo, canRedo }
}

/* ─────────────────────────────────────────────────────────────
   TEST RUN MODAL
───────────────────────────────────────────────────────────── */

function TestModal({ autoId, onClose }: { autoId: string; onClose: () => void }) {
  const [customers, setCustomers]  = useState<{ id: string; name: string; email: string }[]>([])
  const [selected,  setSelected]   = useState('')
  const [running,   setRunning]    = useState(false)
  const [result,    setResult]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/customers?limit=20').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCustomers(d)
      else if (d.customers) setCustomers(d.customers)
    }).catch(() => {})
  }, [])

  async function doTest() {
    if (!selected) return
    setRunning(true)
    try {
      const res = await fetch('/api/automations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId: autoId, customerId: selected }),
      })
      const data = await res.json()
      setResult(res.ok ? `✅ Run başlatıldı — ID: ${data.runId ?? '?'}` : `❌ Hata: ${data.error ?? res.status}`)
    } catch (err) {
      setResult(`❌ ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: 20, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={16} color="#6366f1" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Test Çalıştır</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>Gerçek müşteri ile akışı test et</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Test Müşterisi</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #ede9fe', background: '#faf9ff', fontSize: 12.5, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
            <option value="">Müşteri seç…</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
            ))}
          </select>
        </div>

        {result && (
          <div style={{ padding: '10px 12px', borderRadius: 9, background: result.startsWith('✅') ? '#f0fdf4' : '#fff1f1', border: `1px solid ${result.startsWith('✅') ? '#86efac' : '#fca5a5'}`, fontSize: 12, color: result.startsWith('✅') ? '#15803d' : '#991b1b', marginBottom: 14 }}>
            {result}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            İptal
          </button>
          <button onClick={doTest} disabled={!selected || running}
            style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: selected && !running ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : '#e2e8f0', cursor: selected && !running ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 700, color: selected && !running ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: selected && !running ? '0 2px 8px rgba(99,102,241,0.3)' : 'none' }}>
            {running ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <FlaskConical size={12} />}
            {running ? 'Çalışıyor…' : 'Çalıştır'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   AUTOMATION BUILDER
───────────────────────────────────────────────────────────── */

export function AutomationBuilder({ overrideId }: { overrideId?: string }) {
  const params = useParams() as Record<string, string>
  const router = useRouter()
  const id     = overrideId ?? params.id ?? 'new'

  const { screenToFlowPosition, fitView } = useReactFlow()
  const canvasRef   = useRef<HTMLDivElement>(null)
  const currentIdRef = useRef<string>(id)

  /* ── State ─────────────────────────────────────────────── */
  const [nodes,       setNodes,       onNodesChange] = useNodesState<Node[]>([])
  const [edges,       setEdges,       onEdgesChange] = useEdgesState<Edge[]>([])
  const [flowName,    setFlowName]    = useState('Yeni Otomasyon')
  const [status,      setStatus]      = useState<'draft'|'active'|'paused'>('draft')
  const [trigger,     setTrigger]     = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [activating,  setActivating]  = useState(false)
  const [selectedNode,setSelectedNode] = useState<Node | null>(null)
  const [editingName, setEditingName]  = useState(false)
  const [lastSaved,   setLastSaved]    = useState<Date | null>(null)
  const [toast,       setToast]        = useState<Toast | null>(null)
  const [showTest,    setShowTest]     = useState(false)
  const [cloning,     setCloning]      = useState(false)
  const [flowStats,   setFlowStats]    = useState({ entered: 0, converted: 0 })

  const showToast = (type: Toast['type'], msg: string) => setToast({ type, msg })

  /* ── History ────────────────────────────────────────────── */
  const history = useHistory(
    (n) => setNodes(n),
    (e) => setEdges(e),
  )

  /* ── Load ───────────────────────────────────────────────── */
  useEffect(() => {
    const realId = overrideId ?? params.id ?? 'new'
    currentIdRef.current = realId
    if (!realId || realId === 'new') { setLoading(false); return }

    fetch(`/api/automations/${realId}/flow`)
      .then(r => r.json())
      .then(data => {
        if (data.name)    setFlowName(data.name)
        if (data.status)  setStatus(data.status)
        if (data.trigger) setTrigger(data.trigger)
        if (data.sent || data.converted) setFlowStats({ entered: data.sent ?? 0, converted: data.converted ?? 0 })
        const fd = data.flowData ?? {}
        if (Array.isArray(fd.nodes) && fd.nodes.length > 0) {
          setNodes(fd.nodes)
          setEdges(fd.edges ?? [])
          setTimeout(() => fitView({ padding: 0.3 }), 100)
        }
      })
      .catch(() => showToast('error', 'Otomasyon yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])  // eslint-disable-line

  /* ── Keyboard shortcuts ─────────────────────────────────── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); history.undo() }
      if (meta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); history.redo() }
      if (meta && e.key === 's') { e.preventDefault(); saveFlow() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nodes, edges, flowName, status]) // eslint-disable-line

  /* ── Connect ────────────────────────────────────────────── */
  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => {
      const next = addEdge({ ...conn, ...EDGE_OPTIONS }, eds)
      history.snap(nodes, next)
      return next
    })
  }, [setEdges, nodes, history]) // eslint-disable-line

  /* ── Drag over / drop ───────────────────────────────────── */
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const blockType = e.dataTransfer.getData('application/reactflow')
    if (!blockType) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const rfType   = getReactFlowType(blockType)
    const newNode: Node = { id: `${blockType}_${Date.now()}`, type: rfType, position, data: buildNodeData(blockType) }
    setNodes(nds => {
      const next = [...nds, newNode]
      history.snap(next, edges)
      return next
    })
    if (rfType === 'triggerNode') setTrigger(blockType)
  }, [screenToFlowPosition, setNodes, edges, history]) // eslint-disable-line

  /* ── Selection ──────────────────────────────────────────── */
  const onNodeClick  = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), [])
  const onPaneClick  = useCallback(() => setSelectedNode(null), [])

  /* ── Update node ────────────────────────────────────────── */
  function updateNode(nodeId: string, patch: Record<string, unknown>) {
    setNodes(nds => {
      const next = nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)
      return next
    })
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...patch } } : prev)
  }

  /* ── Delete / Copy ──────────────────────────────────────── */
  function deleteNode(nodeId: string) {
    setNodes(nds => { const next = nds.filter(n => n.id !== nodeId); history.snap(next, edges); return next })
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  function copyNode(node: Node) {
    const copy: Node = { ...node, id: `${node.id}_c${Date.now()}`, position: { x: node.position.x + 48, y: node.position.y + 48 }, selected: false }
    setNodes(nds => { const next = [...nds, copy]; history.snap(next, edges); return next })
  }

  /* ── Derive trigger ─────────────────────────────────────── */
  function deriveTrigger(ns: Node[]) {
    return ns.find(n => n.type === 'triggerNode')?.data?.triggerType as string ?? trigger
  }

  /* ── Save ───────────────────────────────────────────────── */
  async function saveFlow(targetStatus = status): Promise<string | null> {
    setSaving(true)
    try {
      const payload = { name: flowName, status: targetStatus, trigger: deriveTrigger(nodes), flowData: { nodes, edges } }
      const realId  = currentIdRef.current

      if (realId && realId !== 'new') {
        const res = await fetch(`/api/automations/${realId}/flow`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
        setLastSaved(new Date())
        return realId
      } else {
        const res = await fetch('/api/automations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, steps: '[]' }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
        const data = await res.json()
        if (!data.id) throw new Error('ID dönmedi')
        currentIdRef.current = data.id
        setLastSaved(new Date())
        router.replace(`/automations/${data.id}/builder`)
        return data.id
      }
    } catch (err) {
      showToast('error', `Kayıt başarısız: ${err instanceof Error ? err.message : String(err)}`)
      return null
    } finally {
      setSaving(false)
    }
  }

  /* ── Activate / Pause ───────────────────────────────────── */
  async function toggleActivation() {
    setActivating(true)
    const next = status === 'active' ? 'paused' : 'active'
    try {
      const savedId = await saveFlow(next)
      if (!savedId) return
      await fetch(`/api/automations/${savedId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      setStatus(next)
      showToast('success', next === 'active' ? '🚀 Otomasyon yayına alındı' : 'Otomasyon duraklatıldı')
    } catch (err) {
      showToast('error', `İşlem başarısız: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setActivating(false)
    }
  }

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4fe' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-3)', marginTop: 12, fontSize: 13 }}>Yükleniyor…</p>
      </div>
    </div>
  )

  const st       = STATUS_CFG[status] ?? STATUS_CFG.draft
  const isActive = status === 'active'
  const savedAgo = lastSaved ? (() => {
    const d = Math.round((Date.now() - lastSaved.getTime()) / 1000)
    return d < 5 ? 'Az önce kaydedildi' : d < 60 ? `${d}sn önce` : `${Math.round(d/60)}dk önce`
  })() : null

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f3fb', overflow: 'hidden' }}>

      {/* ════════════════════ HEADER ════════════════════════ */}
      <header style={{
        height: 58, background: 'var(--surface)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
        display: 'flex', alignItems: 'center', padding: '0 18px', gap: 8, flexShrink: 0,
        boxShadow: '0 1px 0 rgba(99,102,241,0.06), 0 2px 10px rgba(0,0,0,0.04)',
      }}>

        {/* Back */}
        <button onClick={() => router.push('/automations')} title="Geri" style={{
          width: 32, height: 32, borderRadius: 9, border: '1px solid #e8e4f8',
          background: '#faf9ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a5b4fc', transition: 'all 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.color = '#6366f1' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#faf9ff'; e.currentTarget.style.color = '#a5b4fc' }}>
          <ArrowLeft size={14} />
        </button>

        {/* Breadcrumb + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
          <LayoutGrid size={12} color="#9ca3af" />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Otomasyonlar</span>
          <ChevronRight size={11} color="#d1d5db" />

          {editingName ? (
            <input autoFocus value={flowName}
              onChange={e => setFlowName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', background: '#f5f3ff', border: '1.5px solid #6366f1', borderRadius: 8, padding: '3px 9px', outline: 'none', maxWidth: 240, boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' }} />
          ) : (
            <button onClick={() => setEditingName(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
              color: '#0f172a', padding: '3px 7px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0eeff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {flowName}
              <Pencil size={10} color="#a5b4fc" />
            </button>
          )}

          {/* Status badge */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: st.bg, color: st.text, border: `1px solid ${st.border}`, flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0, animation: isActive ? 'pulse 2s infinite' : 'none' }} />
            {st.label}
          </span>

          {/* Last saved */}
          {savedAgo && (
            <span style={{ fontSize: 10.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <Clock size={10} /> {savedAgo}
            </span>
          )}
        </div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {[
            { Icon: Undo2, fn: history.undo, canDo: history.canUndo, title: 'Geri Al (⌘Z)' },
            { Icon: Redo2, fn: history.redo, canDo: history.canRedo, title: 'İleri Al (⌘⇧Z)' },
          ].map(({ Icon, fn, canDo, title }) => (
            <button key={title} onClick={fn} title={title}
              disabled={!canDo()}
              style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid transparent',
                background: 'transparent', cursor: canDo() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: canDo() ? '#64748b' : '#d1d5db', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (canDo()) { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.color = '#6366f1' } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = canDo() ? '#64748b' : '#d1d5db' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#e8e4f8', flexShrink: 0 }} />

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {/* Clone — only for saved automations */}
          {id !== 'new' && (
            <button onClick={async () => {
              setCloning(true)
              const res = await fetch(`/api/automations/${currentIdRef.current}/clone`, { method: 'POST' })
              const data = await res.json()
              if (res.ok) { showToast('success', `"${data.name}" oluşturuldu`); router.push('/automations') }
              else showToast('error', data.error ?? 'Klonlama başarısız')
              setCloning(false)
            }} disabled={cloning} title="Klonla"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 9, border: '1px solid #e8e4f8',
                background: '#faf9ff', color: '#64748b', cursor: cloning ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.color = '#6366f1' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#faf9ff'; e.currentTarget.style.borderColor = '#e8e4f8'; e.currentTarget.style.color = '#64748b' }}>
              {cloning ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Copy size={12} />}
              Klonla
            </button>
          )}

          {/* Test */}
          <button onClick={() => setShowTest(true)} title="Test Çalıştır"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 9, border: '1px solid #e8e4f8',
              background: '#faf9ff', color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.color = '#6366f1' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#faf9ff'; e.currentTarget.style.borderColor = '#e8e4f8'; e.currentTarget.style.color = '#64748b' }}>
            <FlaskConical size={12} /> Test Et
          </button>

          {/* Save */}
          <button onClick={() => saveFlow()} disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 9, border: '1px solid #e8e4f8',
              background: '#faf9ff', color: '#64748b',
              cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.color = '#6366f1' } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#faf9ff'; e.currentTarget.style.borderColor = '#e8e4f8'; e.currentTarget.style.color = '#64748b' }}>
            {saving ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={12} />}
            Kaydet
          </button>

          {/* Publish / Pause */}
          <button onClick={toggleActivation} disabled={activating || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9,
              border: isActive ? '1px solid #fde68a' : 'none',
              background: isActive ? '#fffbeb' : 'linear-gradient(135deg,#6366f1,#7c3aed)',
              color: isActive ? '#d97706' : '#ffffff',
              cursor: (activating || saving) ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
              opacity: (activating || saving) ? 0.8 : 1,
              boxShadow: isActive ? 'none' : '0 2px 10px rgba(99,102,241,0.38)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.87' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            {activating ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
              : isActive ? <Pause size={12} /> : <Rocket size={12} />}
            {isActive ? 'Duraklat' : 'Yayına Al'}
          </button>
        </div>
      </header>

      {/* ════════════════════ BODY ══════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT */}
        <BlockLibrary />

        {/* CENTER — Canvas */}
        <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={EDGE_OPTIONS}
            fitView fitViewOptions={{ padding: 0.4 }}
            minZoom={0.12} maxZoom={2.5}
            style={{ background: 'transparent' }}
          >
            <Background color="rgba(99,102,241,0.16)" gap={26} size={1.5} variant={BackgroundVariant.Dots} />

            <Controls style={{ background: 'var(--surface)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />

            <MiniMap
              nodeColor={n => {
                if (n.type === 'triggerNode') return '#ede9fe'
                if (n.type === 'stopNode')    return '#dcfce7'
                if (n.type === 'waitNode')    return '#fef3c7'
                if (n.type === 'conditionNode') return '#e0e7ff'
                return '#dbeafe'
              }}
              nodeStrokeColor={n => {
                if (n.type === 'triggerNode') return '#7c3aed'
                if (n.type === 'stopNode')    return '#16a34a'
                if (n.type === 'waitNode')    return '#d97706'
                return '#4f46e5'
              }}
              nodeStrokeWidth={2}
              maskColor="rgba(99,102,241,0.04)"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(99,102,241,0.14)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              }}
              pannable
              zoomable
            />

            {/* Node count badge */}
            {nodes.length > 0 && (
              <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 8, padding: '4px 10px', fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {nodes.length} blok · {edges.length} bağlantı
              </div>
            )}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, pointerEvents: 'none' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1.5px dashed #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.16)' }}>
                  <Zap size={30} color="#7c3aed" strokeWidth={1.4} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e1b4b', letterSpacing: '-0.01em' }}>Akışını oluşturmaya başla</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                    Sol panelden bir <strong style={{ color: '#6366f1', fontWeight: 600 }}>TETİKLEYİCİ</strong> seç ve canvas'a sürükle
                  </p>
                </div>
              </div>
            )}
          </ReactFlow>
        </div>

        {/* RIGHT */}
        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onCopy={copyNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Test modal */}
      {showTest && currentIdRef.current !== 'new' && (
        <TestModal autoId={currentIdRef.current} onClose={() => setShowTest(false)} />
      )}
      {showTest && currentIdRef.current === 'new' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowTest(false)} />
          <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <p style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 12 }}>Önce otomasyonu kaydet</p>
            <button onClick={() => setShowTest(false)} style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Tamam</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <ToastBar t={toast} onClose={() => setToast(null)} />}

      {/* Global styles */}
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes toastUp { from{opacity:0;transform:translateY(10px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
        @keyframes nodein  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }

        .react-flow__node { cursor:default!important; animation:nodein 0.18s ease; }
        .react-flow__node:hover { z-index:10; }

        .react-flow__controls-button {
          background:#fff!important; border:none!important;
          border-bottom:1px solid #f1f5f9!important;
          color:#64748b!important; fill:#64748b!important;
          width:28px!important; height:28px!important;
        }
        .react-flow__controls-button:hover { background:#f5f3ff!important; fill:#6366f1!important; color:#6366f1!important; }
        .react-flow__controls-button svg { fill:inherit!important; }

        .react-flow__edge-path { stroke-linecap:round; filter:drop-shadow(0 1px 3px rgba(99,102,241,0.2)); }
        .react-flow__edge.selected .react-flow__edge-path { stroke:#7c3aed!important; stroke-width:2.5!important; }
        .react-flow__connection-line { stroke:#6366f1!important; stroke-width:2!important; opacity:0.6; }

        .react-flow__handle { transition:transform 0.14s cubic-bezier(.34,1.56,.64,1),box-shadow 0.14s; }
        .react-flow__handle:hover { transform:scale(1.6)!important; box-shadow:0 0 0 6px rgba(99,102,241,0.2)!important; }

        .react-flow__minimap { border-radius:12px!important; }
        .react-flow__pane { cursor:grab!important; }
        .react-flow__pane:active { cursor:grabbing!important; }

        input[type=range] { -webkit-appearance:none; height:5px; border-radius:3px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#6366f1; cursor:pointer; box-shadow:0 1px 4px rgba(99,102,241,0.4); }
      `}</style>
    </div>
  )
}
