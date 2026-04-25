'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, X, Pencil, Scissors } from 'lucide-react'
import { Service } from '@/lib/types'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

const COLORS = ['#F43F5E','#EC4899','#A855F7','#6366F1','#06B6D4','#10B981','#F59E0B','#EF4444']

function formatEur(v: number) {
  return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function ServiceRow({ service, onSave }: { service: Service; onSave: (s: Service) => void }) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(service.price.toString())
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await apiFetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, price: parseFloat(price) }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
      setEditing(false)
      toast.success('Preço atualizado')
    } catch {
      toast.error('Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${service.color}18`, border: `1px solid ${service.color}30` }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: service.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{service.name}</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>€</span>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-20 pl-6 pr-2 py-1.5 text-sm text-white rounded-lg focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(244,63,94,0.4)' }}
              step="0.50" min="0" autoFocus
            />
          </div>
          <button onClick={save} disabled={saving}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all"
            style={{ background: '#10D988' }}>
            <Check className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => { setEditing(false); setPrice(service.price.toString()) }}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">{formatEur(service.price)}</span>
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function AddServiceModal({ onAdd, onClose }: { onAdd: (s: Service) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), price: parseFloat(price), color }),
      })
      if (!res.ok) throw new Error()
      onAdd(await res.json())
      toast.success('Serviço adicionado')
      onClose()
    } catch {
      toast.error('Erro ao adicionar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10" style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Novo serviço</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Nome do serviço</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Manicure simples"
              className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/20 focus:outline-none text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Preço (€)</label>
            <input
              type="number" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="0.00" step="0.50" min="0"
              className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/20 focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-3 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Cor</label>
            <div className="flex gap-2.5">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all active:scale-95"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '3px' }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 mt-2"
            style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899)', boxShadow: '0 8px 24px rgba(244,63,94,0.25)' }}
          >
            {saving ? 'A guardar...' : 'Adicionar serviço'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    apiFetch('/api/services').then(r => r.json()).then(setServices).finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-up fade-up-1">
        <div>
          <p className="text-xs tracking-widest uppercase font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Configuração</p>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Serviços</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899)', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl px-4 py-3 mb-5 fade-up fade-up-1" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.12)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(244,63,94,0.8)' }}>
          Os nomes devem corresponder <strong>exatamente</strong> aos títulos dos eventos no Google Calendar.
        </p>
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden glass fade-up fade-up-2">
        {loading ? (
          <div className="p-5 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-14">
            <Scissors className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Sem serviços configurados</p>
          </div>
        ) : (
          services.map(s => (
            <ServiceRow key={s.id} service={s} onSave={u => setServices(p => p.map(x => x.id === u.id ? u : x))} />
          ))
        )}
      </div>

      {showAdd && <AddServiceModal onAdd={s => setServices(p => [...p, s])} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
