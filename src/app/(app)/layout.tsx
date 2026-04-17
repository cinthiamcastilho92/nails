import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grain" style={{ background: '#080810' }}>
      <main className="max-w-lg mx-auto pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
