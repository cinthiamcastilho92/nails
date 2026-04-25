'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { LogOut, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import MonthPicker from '@/components/MonthPicker'
import { MonthSummary } from '@/lib/types'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

function formatEur(v: number) {
  return v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(step)
      else prev.current = target
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

function KpiCard({ label, value, sub, gradient, icon: Icon, delay }: {
  label: string; value: number; sub?: string
  gradient: string; icon: React.ElementType; delay: string
}) {
  const animated = useCountUp(value)
  return (
    <div className={`rounded-2xl p-5 fade-up ${delay}`} style={{ background: gradient }}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)', letterSpacing: '-0.02em' }}>
        {formatEur(animated)}
      </p>
      {sub && <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/dashboard?month=${month}&year=${year}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const chartData = data?.dailyData.map(d => ({
    dia: d.date.split('-')[2],
    Receitas: d.income,
    Despesas: d.expenses,
  })) || []

  const totalIncome = data?.totalIncome || 0
  const totalExpenses = data?.totalExpenses || 0
  const profit = data?.profit || 0

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center justify-between fade-up fade-up-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#F43F5E' }} />
          <span className="text-xs tracking-widest uppercase font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Nails Finance
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Profile avatar */}
      <div className="flex flex-col items-center pb-6 fade-up fade-up-1">
        <div className="relative mb-3">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899)', padding: '2px', borderRadius: '9999px' }}>
            <div className="w-full h-full rounded-full" style={{ background: '#080810' }} />
          </div>
          {/* Gradient border wrapper */}
          <div className="relative rounded-full p-[3px]"
            style={{ background: 'linear-gradient(135deg, #F43F5E, #EC4899, #A855F7)' }}>
            <div className="w-24 h-24 rounded-full overflow-hidden">
              <img
                src="/manicure.jpg"
                alt="Manicure"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
          {/* Online dot */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{ background: '#10D988', borderColor: '#080810' }} />
        </div>
        <h1 className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: 'var(--font-playfair)' }}>
          O meu estúdio
        </h1>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Resumo mensal</p>
      </div>

      <div className="px-4 pt-0">

      {/* Month picker */}
      <div className="flex justify-center mb-6 fade-up fade-up-1">
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Profit — hero card */}
          <div
            className="rounded-3xl p-6 fade-up fade-up-1 glow-rose relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0a10 0%, #1f0d16 100%)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <p className="text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Lucro líquido
            </p>
            <p
              className="text-4xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-playfair)', color: '#FFFFFF', letterSpacing: '-0.03em' }}
            >
              {formatEur(profit)}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {profit >= 0 ? '↑ Positivo este mês' : '↓ Atenção às despesas'}
            </p>
          </div>

          {/* Income + Expenses row */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Receitas"
              value={totalIncome}
              sub={`${data?.incomeByService.reduce((s, i) => s + i.count, 0) || 0} serviços`}
              gradient="linear-gradient(135deg, #1a0d1a, #1f0f1c)"
              icon={TrendingUp}
              delay="fade-up-2"
            />
            <KpiCard
              label="Despesas"
              value={totalExpenses}
              gradient="linear-gradient(135deg, #0d0d1a, #0f0f1f)"
              icon={TrendingDown}
              delay="fade-up-2"
            />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-2xl p-5 glass fade-up fade-up-3">
              <p className="text-xs font-semibold mb-4 tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Evolução do mês
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(v) => formatEur(Number(v))}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Area type="monotone" dataKey="Receitas" stroke="#F43F5E" strokeWidth={1.5} fill="url(#gIncome)" />
                  <Area type="monotone" dataKey="Despesas" stroke="#6366f1" strokeWidth={1.5} fill="url(#gExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Services breakdown */}
          {(data?.incomeByService.length || 0) > 0 && (
            <div className="rounded-2xl p-5 glass fade-up fade-up-4">
              <p className="text-xs font-semibold mb-4 tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Por serviço
              </p>
              <div className="space-y-4">
                {data!.incomeByService.map(svc => {
                  const pct = data!.totalIncome > 0 ? (svc.total / data!.totalIncome) * 100 : 0
                  return (
                    <div key={svc.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: svc.color }} />
                          <span className="text-sm text-white/70">{svc.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>×{svc.count}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{formatEur(svc.total)}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: svc.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Expenses by category */}
          {(data?.expensesByCategory.length || 0) > 0 && (
            <div className="rounded-2xl p-5 glass fade-up fade-up-5">
              <p className="text-xs font-semibold mb-3 tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Despesas
              </p>
              <div className="space-y-2">
                {data!.expensesByCategory.map(cat => (
                  <div key={cat.category} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{cat.category}</span>
                    <span className="text-sm font-medium text-white">{formatEur(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalIncome === 0 && totalExpenses === 0 && (
            <div className="text-center py-16 fade-up fade-up-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <Sparkles className="w-7 h-7" style={{ color: 'rgba(244,63,94,0.6)' }} />
              </div>
              <p className="text-sm font-medium text-white/50">Sem dados este mês</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Sincroniza o calendário ou adiciona despesas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  )
}
