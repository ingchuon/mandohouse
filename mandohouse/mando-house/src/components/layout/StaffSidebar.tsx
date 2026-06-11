'use client'
// src/components/layout/StaffSidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

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
      { href: '/staff/schedule', label: 'ตารางสอน',        icon: '🗓' },
      { href: '/staff/reviews',  label: 'รีวิวหลังสอน',   icon: '⭐' },
      { href: '/staff/courses',  label: 'คอร์สและราคา',   icon: '📚' },
    ],
  },
  {
    group: 'การแจ้งเตือน',
    items: [
      { href: '/staff/alerts', label: 'แจ้งเตือน LINE', icon: '🔔' },
    ],
  },
  {
    group: 'การเงิน',
    items: [
      { href: '/staff/receipts', label: 'ออกใบเสร็จ',   icon: '🧾' },
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
    <aside className="w-56 flex-shrink-0 bg-gray-900 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-base">曼</div>
          <div>
            <div className="text-white font-semibold text-sm tracking-wide">Mando House</div>
            <div className="text-white/35 text-[10px]">ระบบหลังบ้าน</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-white/85 text-xs font-medium truncate">{name || '—'}</div>
          <div className="text-white/35 text-[10px]">เจ้าหน้าที่</div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ group, items }) => (
          <div key={group} className="mb-3">
            <div className="px-5 py-1 text-[10px] font-medium text-white/25 uppercase tracking-widest">
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
                      ? 'bg-brand-500/20 text-brand-200 border-l-2 border-brand-400'
                      : 'text-white/55 hover:text-white/85 hover:bg-white/5 border-l-2 border-transparent'
                  )}
                >
                  <span className="text-base w-5 text-center">{icon}</span>
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {alertCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors w-full">
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">曼</div>
          <span className="text-white font-semibold text-sm">Mando House</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-white/70 hover:text-white p-1"
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
