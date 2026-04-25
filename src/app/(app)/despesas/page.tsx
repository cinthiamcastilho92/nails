'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Trash2, Camera, X, ShoppingBag, Home, Wrench, Megaphone, MoreHorizontal, Receipt } from 'lucide-react'
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '@/lib/types'
import MonthPicker from '@/components/MonthPicker'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

function formatEur(v: number) {
  return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Produtos': ShoppingBag,
  'Aluguel / Espaço': Home,
  'Equipamentos': Wrench,
  'Marketing': Megaphone,
  'Outras': MoreHorizontal,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Produtos': '#F43F5E',
  'Aluguel / Espaço': '#6366F1',
  'Equipamentos': '#A855F7',
  'Marketing': '#F59E0B',
  'Outras': 'rgba(255,255,255,0.4)',
}

function AddExpenseModal({ onAdd, onClose }: { onAdd: (e: Expense) => void; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Produtos')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) { toast.error('Insere um valor válido'); return }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('date', date)
      formData.append('amount', amount)
      formData.append('category', category)
      formData.append('description', description)
      if (file) formData.append('receipt', file)
      const res = await apiFetch('/api/expenses', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      onAdd(await res.json())
      toast.success('Despesa guardada')
      onClose()
    } catch {
      toast.error('Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-lg rounded-t-3xl overflow-y-auto" style={{ background: '#0E0E1A', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90vh' }}>
        <div className="sticky top-0 px-6 pt-5 pb-4" style={{ background: '#0E0E1A', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Nova despesa</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-5 pb-10">
          {/* Foto */}
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Foto da fatura (opcional)</label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Fatura" className="w-full h-32 object-cover rounded-xl" />
                <button type="button" onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: 'rgba(8,8,16,0.8)', color: 'white' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                style={{ border: '1.5px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }}>
                <Camera className="w-5 h-5" />
                <span className="text-xs">Tirar foto ou escolher ficheiro</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          </div>

          {/* Data + valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-white text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Valor (€)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" step="0.01" min="0.01"
                className="w-full px-3 py-3 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                required />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium mb-3 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map(cat => {
                const Icon = CATEGORY_ICONS[cat]
                const active = category === cat
                const color = CATEGORY_COLORS[cat]
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: active ? `${color}15` : 'rgba(255,255,255,0.04)',
                      border: active ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
                      color: active ? color : 'rgba(255,255,255,0.45)',
                    }}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Descrição (opcional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Vernizes OPI, acetona..."
              className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899)', boxShadow: '0 8px 24px rgba(244,63,94,0.25)' }}>
            {saving ? 'A guardar...' : 'Guardar despesa'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DespesasPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/expenses?month=${month}&year=${year}`)
      const data = await res.json()
      setExpenses(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await apiFetch('/api/expenses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error()
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Despesa eliminada')
    } catch {
      toast.error('Erro ao eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const byDate = expenses.reduce<Record<string, Expense[]>>((acc, item) => {
    acc[item.date] = [...(acc[item.date] || []), item]
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-up fade-up-1">
        <div>
          <p className="text-xs tracking-widest uppercase font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Registo</p>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Despesas</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899)', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </button>
      </div>

      {/* Month picker */}
      <div className="flex justify-center mb-5 fade-up fade-up-1">
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
      </div>

      {/* Total */}
      {!loading && expenses.length > 0 && (
        <div className="rounded-2xl p-5 mb-5 fade-up fade-up-2"
          style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0f22)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p className="text-xs tracking-widest uppercase mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Total de despesas</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)', letterSpacing: '-0.02em' }}>
              {formatEur(total)}
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Receipt className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{expenses.length} itens</span>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 fade-up fade-up-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Receipt className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Sem despesas este mês</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Clica em Adicionar para registar</p>
        </div>
      ) : (
        <div className="space-y-5 fade-up fade-up-3">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {format(new Date(date + 'T12:00:00'), "d 'de' MMMM", { locale: pt })}
              </p>
              <div className="rounded-2xl overflow-hidden glass">
                {byDate[date].map((item, i) => {
                  const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal
                  const color = CATEGORY_COLORS[item.category] || 'rgba(255,255,255,0.4)'
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < byDate[date].length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{item.category}</p>
                        {item.description && <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-white">{formatEur(Number(item.amount))}</span>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddExpenseModal onAdd={e => setExpenses(prev => [e, ...prev])} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
