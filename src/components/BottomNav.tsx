'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Receipt, Scissors } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Resumo', icon: LayoutDashboard },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/despesas', label: 'Despesas', icon: Receipt },
  { href: '/servicos', label: 'Serviços', icon: Scissors },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-lg mx-auto flex items-center px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 min-h-[60px] transition-all active:scale-95"
            >
              <div className="relative flex items-center justify-center w-10 h-7">
                {active && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(244,63,94,0.15)' }}
                  />
                )}
                <Icon
                  className="w-5 h-5 relative z-10 transition-all"
                  style={{ color: active ? '#F43F5E' : 'rgba(255,255,255,0.35)', strokeWidth: active ? 2.5 : 1.8 }}
                />
              </div>
              <span
                className="text-[10px] leading-none font-medium transition-all"
                style={{ color: active ? '#F43F5E' : 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
