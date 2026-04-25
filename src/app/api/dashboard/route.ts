import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = Number(searchParams.get('month') || new Date().getMonth() + 1)
  const year = Number(searchParams.get('year') || new Date().getFullYear())

  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const supabase = createServerClient()

  const [incomeRes, expensesRes, servicesRes] = await Promise.all([
    supabase.from('income').select('*').eq('user_id', userId).gte('date', start).lte('date', end),
    supabase.from('expenses').select('*').eq('user_id', userId).gte('date', start).lte('date', end),
    supabase.from('services').select('*').eq('user_id', userId).eq('active', true),
  ])

  const income = incomeRes.data || []
  const expenses = expensesRes.data || []
  const services = servicesRes.data || []

  const serviceMap = new Map(services.map(s => [s.name, s]))

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const incomeByServiceMap = new Map<string, { total: number; count: number; color: string }>()
  for (const item of income) {
    const svc = serviceMap.get(item.service_name)
    const existing = incomeByServiceMap.get(item.service_name) || { total: 0, count: 0, color: svc?.color || '#ec4899' }
    existing.total += Number(item.amount)
    existing.count += 1
    incomeByServiceMap.set(item.service_name, existing)
  }

  const incomeByService = Array.from(incomeByServiceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)

  const expensesByCategoryMap = new Map<string, number>()
  for (const item of expenses) {
    expensesByCategoryMap.set(item.category, (expensesByCategoryMap.get(item.category) || 0) + Number(item.amount))
  }
  const expensesByCategory = Array.from(expensesByCategoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const dailyMap = new Map<string, { income: number; expenses: number }>()
  for (const item of income) {
    const d = dailyMap.get(item.date) || { income: 0, expenses: 0 }
    d.income += Number(item.amount)
    dailyMap.set(item.date, d)
  }
  for (const item of expenses) {
    const d = dailyMap.get(item.date) || { income: 0, expenses: 0 }
    d.expenses += Number(item.amount)
    dailyMap.set(item.date, d)
  }

  const dailyData = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    profit: totalIncome - totalExpenses,
    incomeByService,
    expensesByCategory,
    dailyData,
  })
}
