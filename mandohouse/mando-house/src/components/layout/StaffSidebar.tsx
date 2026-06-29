'use client'
// src/components/layout/StaffSidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/ThemeProvider'

const navItems = [
  {
    group: 'ภาพรวม',
    items: [
      { href: '/staff', label: 'Dashboard', icon: '⊞' },
    ],
  },
  {
    group: 'นักเรียน',
    items: [
      { href: '/staff/students',     label: 'ข้อมูลนักเรียน',   icon: '👥' },
      { href: '/staff/checkin',      label: 'เช็กอิน / เช็กเอาท์', icon: '🕐' },
      { href: '/staff/lessons',      label: 'นับครั้งการเรียน', icon: '📅' },
    ],
  },
  {
    group: 'การสอน',
    items: [
      { href: '/staff/teaching-report', label: 'รายงานชั่วโมงสอน', icon: '⏱' },
      { href: '/staff/teachers', label: 'จัดการครู',     icon: '🧑‍🏫' },
      { href: '/staff/schedule', label: 'ตารางสอน',        icon: '🗓' },
      { href: '/staff/courses',  label: 'คอร์สและราคา',   icon: '📚' },
    ],
  },
  {
    group: 'การเงิน',
    items: [
      { href: '/staff/receipts', label: 'ออกใบเสร็จ',   icon: '🧾' },
      { href: '/staff/books',    label: 'จัดการหนังสือ', icon: '📖' },
      { href: '/staff/expenses', label: 'รายจ่าย',       icon: '📤' },
      { href: '/staff/import',   label: 'Import ข้อมูล', icon: '📥' },
    ],
  },
  {
    group: 'ทีมงาน',
    items: [
      { href: '/staff/team',     label: 'จัดการทีม',      icon: '🎓' },
      { href: '/staff/settings', label: 'ตั้งค่ายอดเงิน', icon: '⚙️' },
      { href: '/staff/help',     label: 'คู่มือการใช้งาน', icon: '📖' },
    ],
  },
]

export default function StaffSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [alertCount, setAlertCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => setName(data?.full_name ?? ''))
    })
    supabase.from('enrollments')
      .select('lessons_used, lessons_total')
      .eq('status', 'active')
      .then(({ data }) => {
        const count = (data ?? []).filter(e => (e.lessons_total - e.lessons_used) <= 3).length
        setAlertCount(count)
      })
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('ออกจากระบบแล้ว')
    router.push('/login')
  }

  const initials = name ? name.slice(0, 2) : '..'

  const sidebarContent = (
    <aside className="w-56 flex-shrink-0 bg-brand-500 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Mando House" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm tracking-wide">Mando House</div>
            <div className="text-white/60 text-[10px]">ระบบหลังบ้าน</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/15 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-white text-xs font-medium truncate">{name || '—'}</div>
          <div className="text-white/60 text-[10px]">เจ้าหน้าที่</div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ group, items }) => (
          <div key={group} className="mb-3">
            <div className="px-5 py-1 text-[10px] font-medium text-white/50 uppercase tracking-widest">
              {group}
            </div>
            {items.map(({ href, label, icon }) => {
              const active = href === '/staff' ? pathname === '/staff' : pathname.startsWith(href)
              const showBadge = href === '/staff/alerts' && alertCount > 0
              return (
                <Link key={href} href={href}
                  className={cn(
                    'flex items-center gap-2.5 px-5 py-2.5 text-sm transition-all',
                    active
                      ? 'bg-cream-200 text-brand-700 border-l-2 border-cream-500 font-medium'
                      : 'text-white/80 hover:text-white hover:bg-white/10 border-l-2 border-transparent'
                  )}
                >
                  <span className="text-base w-5 text-center">{icon}</span>
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {alertCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/15 space-y-1">
        <ThemeToggle />
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-full">
          <span className="text-base">↩</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-500 flex items-center justify-between px-4 py-3 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Mando House" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-semibold text-sm">Mando House</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-white/80 hover:text-white p-1"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
          <div className="w-64 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
