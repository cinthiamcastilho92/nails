'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Link2, CheckCircle2, AlertCircle, Euro, Calendar } from 'lucide-react'
import MonthPicker from '@/components/MonthPicker'
import { Income } from '@/lib/types'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

function formatEur(v: number) {
  return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

export default function CalendarioPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    apiFetch('/api/calendar/status')
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false))
  }, [])

  const fetchIncome = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/income?month=${month}&year=${year}`)
      const data = await res.json()
      setIncome(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar receitas')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchIncome() }, [fetchIncome])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      setConnected(true)
      toast.success('Google Calendar ligado!')
      window.history.replaceState({}, '', '/calendario')
    }
    if (params.get('error')) {
      toast.error(`Erro: ${params.get('error')}`)
      window.history.replaceState({}, '', '/calendario')
    }
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await apiFetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.synced} serviço(s) sincronizado(s)`)
      if (data.skipped > 0) toast.info(`${data.skipped} evento(s) sem correspondência`)
      await fetchIncome()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const total = income.reduce((s, i) => s + Number(i.amount), 0)
  const byDate = income.reduce<Record<string, Income[]>>((acc, item) => {
    acc[item.date] = [...(acc[item.date] || []), item]
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 fade-up fade-up-1">
        <div>
          <p className="text-xs tracking-widest uppercase font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Google Calendar</p>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Calendário</h1>
        </div>
        {connected === true && (
          <button
            onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899)', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'A sincronizar...' : 'Sincronizar'}
          </button>
        )}
      </div>

      {/* Connection status */}
      {connected === false && (
        <div className="rounded-2xl p-5 mb-5 fade-up fade-up-1" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">Google Calendar não ligado</p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Liga a tua conta para importar os serviços automaticamente.</p>
              <button
                onClick={async () => {
                  const res = await apiFetch('/api/auth/google')
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold active:scale-95 transition-all"
                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                <Link2 className="w-3.5 h-3.5" />
                Ligar Google Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {connected === true && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-5 fade-up fade-up-1"
          style={{ background: 'rgba(16,217,136,0.06)', border: '1px solid rgba(16,217,136,0.15)' }}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#10D988' }} />
          <p className="text-xs font-medium" style={{ color: '#10D988' }}>Google Calendar ligado</p>
        </div>
      )}

      {/* Month picker */}
      <div className="flex justify-center mb-5 fade-up fade-up-1">
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
      </div>

      {/* Total card */}
      {!loading && income.length > 0 && (
        <div className="rounded-2xl p-5 mb-5 fade-up fade-up-2 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0a10, #1f0d16)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <p className="text-xs tracking-widest uppercase mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Total de receitas</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)', letterSpacing: '-0.02em' }}>
              {formatEur(total)}
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Calendar className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{income.length} serviços</span>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : income.length === 0 ? (
        <div className="text-center py-16 fade-up fade-up-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Calendar className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Sem receitas este mês</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {connected ? 'Clica em Sincronizar' : 'Liga o Google Calendar primeiro'}
          </p>
        </div>
      ) : (
        <div className="space-y-5 fade-up fade-up-3">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {format(new Date(date + 'T12:00:00'), "d 'de' MMMM", { locale: pt })}
              </p>
              <div className="rounded-2xl overflow-hidden glass">
                {byDate[date].map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < byDate[date].length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.15)' }}>
                      <Euro className="w-3.5 h-3.5" style={{ color: '#F43F5E' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.service_name}</p>
                      {item.client_name && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.client_name}</p>}
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#10D988' }}>{formatEur(Number(item.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
