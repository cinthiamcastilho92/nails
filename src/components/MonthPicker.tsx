'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Props {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export default function MonthPicker({ month, year, onChange }: Props) {
  function prev() {
    if (month === 1) onChange(12, year - 1)
    else onChange(month - 1, year)
  }
  function next() {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return
    if (month === 12) onChange(1, year + 1)
    else onChange(month + 1, year)
  }
  const now = new Date()
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium min-w-[130px] text-center" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {MONTHS[month - 1]} {year}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-20"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
