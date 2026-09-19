'use client'
// src/components/layout/StaffSidebar.tsx

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/ThemeProvider'
import { SCHOOL_CONFIG } from '@/lib/config'

// ---------- nav structure ----------
const navItems = [
  {
    group: 'ภาพรวม',
      items: [
      { href: '/staff', label: 'Dashboard' },
    ],
  },
  {
    group: 'นักเรียน',
      items: [
      { href: '/staff/students',      label: 'ทะเบียนนักเรียน' },
      { href: '/staff/checkin',       label: 'Check-in / Check-out' },
      { href: '/staff/student-groups',label: 'กลุ่มเรียน' },
    ],
  },
  {
    group: 'งานสอน',
      items: [
      { href: '/staff/schedule',         label: 'ตารางสอน' },
      { href: '/staff/teaching-report',  label: 'ชั่วโมงการสอน' },
      { href: '/staff/teacher-payroll',  label: 'รายงานค่าสอน' },
      { href: '/staff/teachers',         label: 'ครูผู้สอน' },
      { href: '/staff/courses',          label: 'คอร์สเรียน' },
    ],
  },
  {
    group: 'การเงิน',
      items: [
      { href: '/staff/receipts',         label: 'รายรับ' },
      { href: '/staff/expenses',         label: 'รายจ่าย' },
      { href: '/staff/company-receipts', label: 'ใบเสร็จบริษัท' },
      { href: '/staff/settings',         label: 'Finance' },
      { href: '/staff/import',           label: 'Data Hub' },
    ],
  },
  {
    group: 'จัดการระบบ',
      items: [
      { href: '/staff/teacher-rates',    label: 'เรตค่าสอน' },
      { href: '/staff/team',             label: 'จัดการทีมงาน' },
      { href: '/staff/school-settings',  label: 'ตั้งค่าสถาบัน' },
      { href: '/staff/subscriptions',    label: 'Subscription' },
      { href: '/staff/system-health',    label: 'System Health' },
      { href: '/staff/help',             label: 'คู่มือการใช้งาน' },
    ],
  },
]

// ---------- collapsible group ----------
function NavGroup({
  group, items, pathname, alertCount, schoolId, defaultOpen,
}: {
  group: string; items: { href: string; label: string }[]
  pathname: string; alertCount: number; schoolId: string | null; defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasActive = items.some(i =>
    i.href === '/staff' ? pathname === '/staff' : pathname.startsWith(i.href)
  )

  // auto-open if a child is active
  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  return (
    <div className="mb-1">
      {/* group header — clickable to collapse */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-white/50 dark:text-gray-500 uppercase tracking-widest hover:text-white/80 transition-colors"
      >
        <span className="flex-1 text-left">{group}</span>
        <span className={cn('text-[10px] transition-transform duration-200', open ? 'rotate-90' : 'rotate-0')}>▶</span>
      </button>

      {/* items */}
      <div className={cn('overflow-hidden transition-all duration-200', open ? 'max-h-96' : 'max-h-0')}>
        {items.map(({ href, label }) => {
          const active = href === '/staff' ? pathname === '/staff' : pathname.startsWith(href)
          const showBadge = href === '/staff/alerts' && alertCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 pl-9 pr-4 py-2 text-sm transition-all',
                active
                  ? 'bg-cream-200 text-brand-700 border-l-2 border-cream-500 font-medium dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-400'
                  : 'text-white/75 hover:text-white hover:bg-white/10 border-l-2 border-transparent dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-[#2a3245]'
              )}
            >
              <span className="flex-1 min-w-0 truncate">{label}</span>
              {showBadge && (
                <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                  {alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---------- sidebar content ----------
function SidebarInner({
  name, logoUrl, schoolName, schoolId, alertCount, onLogout,
}: {
  name: string; logoUrl: string | null; schoolName: string
  schoolId: string | null; alertCount: number; onLogout: () => void
}) {
  const pathname = usePathname()

  const filtered = navItems.map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (item.href === '/staff/subscriptions' || item.href === '/staff/system-health')
        return schoolId === 'mando'
      return true
    }),
  })).filter(g => g.items.length > 0)

  // which group is currently active?
  const activeGroup = filtered.find(g =>
    g.items.some(i => i.href === '/staff' ? pathname === '/staff' : pathname.startsWith(i.href))
  )?.group

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/15 dark:border-[#2a3245]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={schoolName} className="w-full h-full object-cover" />
              : <img src="/logo.png" alt={schoolName} className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm tracking-wide truncate">{schoolName}</div>
            <div className="text-white/50 text-[10px] tracking-wide">ระบบหลังบ้าน</div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 py-3 border-b border-white/15 dark:border-[#2a3245] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {name ? name.slice(0, 2) : '..'}
        </div>
        <div className="min-w-0">
          <div className="text-white text-xs font-medium truncate">{name || '—'}</div>
          <div className="text-white/50 text-[10px]">เจ้าหน้าที่</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {filtered.map(g => (
          <NavGroup
            key={g.group}
            group={g.group}
            items={g.items}
            pathname={pathname}
            alertCount={alertCount}
            schoolId={schoolId}
            defaultOpen={g.group === activeGroup || g.group === 'Overview'}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-4 border-t border-white/15 dark:border-[#2a3245] space-y-2">
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors w-full"
        >
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </>
  )
}

// ---------- main export ----------
export default function StaffSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [alertCount, setAlertCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string>(SCHOOL_CONFIG.name)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('full_name, school_id').eq('id', user.id).single()
      setName(profile?.full_name ?? '')
      setSchoolId(profile?.school_id ?? null)
      if (profile?.school_id && profile.school_id !== 'mando') {
        const { data: school } = await supabase
          .from('schools').select('name, logo_url').eq('id', profile.school_id).single()
        if (school) { setSchoolName(school.name); setLogoUrl(school.logo_url) }
      }
    }
    load()
    supabase.from('enrollments')
      .select('lessons_used, lessons_total').eq('status', 'active')
      .then(({ data }) => {
        setAlertCount((data ?? []).filter(e => (e.lessons_total - e.lessons_used) <= 3).length)
      })
  }, [])

  useEffect(() => { setDrawerOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('ออกจากระบบแล้ว')
    router.push('/login')
  }

  const sidebarProps = { name, logoUrl, schoolName, schoolId, alertCount, onLogout: handleLogout }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col min-h-screen bg-brand-500 dark:bg-[#141b2d]">
        <SidebarInner {...sidebarProps} />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-brand-500 dark:bg-[#141b2d] flex items-center justify-between px-4 border-b border-white/15 dark:border-[#2a3245]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={schoolName} className="w-full h-full object-cover" />
              : <img src="/logo.png" alt={schoolName} className="w-full h-full object-cover" />}
          </div>
          <span className="text-white font-semibold text-sm truncate">{schoolName}</span>
        </div>
        <button onClick={() => setDrawerOpen(true)} aria-label="เปิดเมนู"
          className="text-white/90 hover:text-white p-2 -mr-2 text-lg flex-shrink-0">☰</button>
      </header>

      {/* Mobile drawer */}
      <div className={cn('md:hidden fixed inset-0 z-50', drawerOpen ? 'visible' : 'invisible pointer-events-none')} aria-hidden={!drawerOpen}>
        <div onClick={() => setDrawerOpen(false)}
          className={cn('absolute inset-0 bg-black/50 transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0')} />
        <aside className={cn(
          'absolute top-0 left-0 h-full w-64 max-w-[80%] flex flex-col bg-brand-500 dark:bg-[#141b2d] overflow-y-auto shadow-2xl transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex justify-end px-3 pt-3">
            <button onClick={() => setDrawerOpen(false)} aria-label="ปิดเมนู" className="text-white/80 hover:text-white p-1 text-lg">✕</button>
          </div>
          <SidebarInner {...sidebarProps} />
        </aside>
      </div>
    </>
  )
}
