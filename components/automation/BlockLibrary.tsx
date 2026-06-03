'use client'

import { useState } from 'react'
import {
  ShoppingCart, UserPlus, Package, Tag, Settings2,
  Mail, MessageCircle, Layers, Activity, Timer,
  GitBranch, Shuffle, CheckCircle, GripVertical,
  Eye, CreditCard, Clock, Gift, Play, Webhook,
  Search, ChevronDown, ChevronUp,
} from 'lucide-react'
import { NODE_META } from './AutomationNodes'

/* ─────────────────────────────────────────────────────────────
   GROUPS
───────────────────────────────────────────────────────────── */

const BLOCK_GROUPS = [
  {
    id: 'triggers',
    title: 'TETİKLEYİCİLER',
    color: '#6366f1',
    items: [
      { type: 'cart_abandoned',    icon: ShoppingCart },
      { type: 'new_customer',      icon: UserPlus     },
      { type: 'order_created',     icon: Package      },
      { type: 'checkout_started',  icon: CreditCard   },
      { type: 'product_viewed',    icon: Eye          },
      { type: 'tag_added',         icon: Tag          },
      { type: 'customer_inactive', icon: Clock        },
      { type: 'birthday',          icon: Gift         },
      { type: 'manual_trigger',    icon: Play         },
      { type: 'custom_event',      icon: Settings2    },
    ],
  },
  {
    id: 'actions',
    title: 'İŞLEMLER',
    color: '#0891b2',
    items: [
      { type: 'send_email',    icon: Mail          },
      { type: 'send_whatsapp', icon: MessageCircle },
      { type: 'add_tag',       icon: Tag           },
      { type: 'remove_tag',    icon: Tag           },
      { type: 'move_segment',  icon: Layers        },
      { type: 'webhook',       icon: Webhook       },
    ],
  },
  {
    id: 'controls',
    title: 'KONTROLLER',
    color: '#7c3aed',
    items: [
      { type: 'wait',       icon: Timer      },
      { type: 'condition',  icon: GitBranch  },
      { type: 'split_test', icon: Shuffle    },
      { type: 'stop',       icon: CheckCircle},
    ],
  },
]

/* ─────────────────────────────────────────────────────────────
   BLOCK ITEM
───────────────────────────────────────────────────────────── */

function BlockItem({ type }: { type: string }) {
  const meta = NODE_META[type]
  if (!meta) return null
  const Icon = meta.icon
  const [hovered, setHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/reactflow', type)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px',
        borderRadius: 9,
        background: hovered ? meta.bgColor : 'transparent',
        border: `1px solid ${hovered ? meta.color + '22' : 'transparent'}`,
        cursor: 'grab',
        transition: 'all 0.13s',
        userSelect: 'none',
        transform: hovered ? 'translateX(2px)' : 'none',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: hovered ? meta.bgColor : '#f8f7ff',
        border: `1px solid ${hovered ? meta.color + '30' : '#ede9fe'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'all 0.13s',
      }}>
        <Icon size={12} color={hovered ? meta.color : '#a5b4fc'} strokeWidth={1.9} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 11, fontWeight: 600,
          color: hovered ? '#0f172a' : '#374151',
          lineHeight: 1.25,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.13s',
        }}>{meta.label}</p>
        <p style={{
          margin: '2px 0 0', fontSize: 9, color: '#94a3b8',
          lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{meta.sublabel}</p>
      </div>

      <GripVertical size={10} color={hovered ? meta.color + '80' : '#d1d5db'} style={{ flexShrink: 0, transition: 'color 0.13s' }} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   GROUP SECTION
───────────────────────────────────────────────────────────── */

function BlockGroup({ group, search }: { group: typeof BLOCK_GROUPS[0]; search: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const filtered = group.items.filter(item => {
    if (!search) return true
    const meta = NODE_META[item.type]
    return meta?.label.toLowerCase().includes(search) || meta?.sublabel.toLowerCase().includes(search)
  })
  if (filtered.length === 0) return null

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Group header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', padding: '5px 8px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderRadius: 7, textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, fontSize: 7.5, fontWeight: 800, color: group.color, textTransform: 'uppercase', letterSpacing: '1.6px' }}>
          {group.title}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#c7d2fe', background: '#eef2ff', borderRadius: 4, padding: '1px 5px', lineHeight: 1.4 }}>
          {filtered.length}
        </span>
        {collapsed
          ? <ChevronDown size={10} color="#94a3b8" />
          : <ChevronUp   size={10} color="#94a3b8" />
        }
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0.5, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
          {filtered.map(item => <BlockItem key={item.type} type={item.type} />)}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   BLOCK LIBRARY PANEL
───────────────────────────────────────────────────────────── */

export default function BlockLibrary() {
  const [search, setSearch] = useState('')
  const q = search.toLowerCase().trim()

  return (
    <aside style={{
      width: 228,
      background: '#ffffff',
      borderRight: '1px solid rgba(99,102,241,0.1)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '2px 0 10px rgba(99,102,241,0.05)',
    }}>

      {/* Header */}
      <div style={{ padding: '14px 14px 11px', borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'linear-gradient(180deg,#fdfcff,#ffffff)' }}>
        <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase' }}>
          BLOKLAR
        </p>
        <p style={{ margin: '3px 0 10px', fontSize: 9.5, color: '#94a3b8', lineHeight: 1.4 }}>
          Sürükle &amp; bırak ile otomasyon oluştur
        </p>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={10} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Blok ara…"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              borderRadius: 8, border: '1px solid #ede9fe',
              background: '#faf9ff', fontSize: 10.5, color: '#334155',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 6px 14px' }}>
        {BLOCK_GROUPS.map(g => <BlockGroup key={g.id} group={g} search={q} />)}

        {/* Drop hint */}
        <div style={{
          margin: '10px 2px 0',
          padding: '9px 10px',
          borderRadius: 9,
          background: 'linear-gradient(135deg,#faf9ff,#f0eeff)',
          border: '1.5px dashed #c4b5fd',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 9.5, color: '#a5b4fc', lineHeight: 1.6, fontWeight: 500 }}>
            Bloğu canvas'a<br />sürükleyip bırak
          </p>
        </div>
      </div>
    </aside>
  )
}
