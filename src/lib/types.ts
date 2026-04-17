export interface Service {
  id: string
  name: string
  price: number
  color: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Income {
  id: string
  calendar_event_id: string | null
  service_name: string
  service_id: string | null
  amount: number
  date: string
  client_name: string | null
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  date: string
  amount: number
  category: string
  description: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export type ExpenseCategory =
  | 'Produtos'
  | 'Aluguel / Espaço'
  | 'Equipamentos'
  | 'Marketing'
  | 'Outras'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Produtos',
  'Aluguel / Espaço',
  'Equipamentos',
  'Marketing',
  'Outras',
]

export interface MonthSummary {
  totalIncome: number
  totalExpenses: number
  profit: number
  incomeByService: { name: string; total: number; count: number; color: string }[]
  expensesByCategory: { category: string; total: number }[]
  dailyData: { date: string; income: number; expenses: number }[]
}
