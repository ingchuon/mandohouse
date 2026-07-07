// src/app/staff/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatThaiMoney, formatDate } from '@/lib/utils'
import Link from 'next/link'
import DashboardExport from '@/components/layout/DashboardExport'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) return <div>ไม่พบ user: {error?.message}</div>

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const nowTH = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
  const today = nowTH.toISOString().split('T')[0]
  const todayStart = today + 'T00:00:00+07:00'
  const todayEnd = today + 'T23:59:59+07:00'
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [
    { count: totalStudents },
    { count: activeEnrollments },
    { data: receiptsThisMonth },
    { data: receiptsLastMonth },
    { data: allActiveEnrollments },
    { data: recentCheckins },
    { data: expensesThisMonth },
    { data: cashBalanceSettings },
    { data: receiptsAfterAnchor },
    { data: expensesAfterAnchor },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('receipts').select('amount, subject, book_fee, enrollment:enrollments(course:courses(name))').gte('issued_at', firstOfMonth),
    supabase.from('receipts').select('amount').gte('issued_at', firstOfLastMonth).lte('issued_at', lastOfLastMonth),
    supabase.from('enrollments')
      .select('*, student:students(nickname, full_name), course:courses(name)')
      .eq('status', 'active'),
    supabase.from('checkins')
      .select('*, student:students(nickname, full_name)')
      .gte('check_in_at', todayStart)
      .lte('check_in_at', todayEnd)
      .order('check_in_at', { ascending: false })
      .limit(12),
    supabase.from('expenses').select('amount').gte('expense_date', firstOfMonth),
    supabase.from('cash_balance_settings').select('anchor_date, anchor_amount').eq('id', 1).single(),
    supabase.from('receipts').select('amount, issued_at'),
    supabase.from('expenses').select('amount, expense_date'),
  ])

  const revenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenueLastMonth = receiptsLastMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenuePct = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0

  const expensesTotal = expensesThisMonth?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0
  const profitThisMonth = revenueThisMonth - expensesTotal

  // เงินคงเหลือปัจจุบัน = ยอด anchor + การเปลี่ยนแปลงตั้งแต่วัน anchor
  const anchorDate = (cashBalanceSettings as any)?.anchor_date ?? today
  const anchorAmount = Number((cashBalanceSettings as any)?.anchor_amount ?? 0)
  const receiptsSinceAnchor = (receiptsAfterAnchor ?? [])
    .filter((r: any) => r.issued_at > anchorDate)
    .reduce((s: number, r: any) => s + Number(r.amount), 0)
  const expensesSinceAnchor = (expensesAfterAnchor ?? [])
    .filter((e: any) => e.expense_date > anchorDate)
    .reduce((s: number, e: any) => s + Number(e.amount), 0)
  const cashBalance = anchorAmount + receiptsSinceAnchor - expensesSinceAnchor

  // ---- รายได้แยกตามวิชา (สำหรับกราฟวงกลม) ----
  const subjects = ['chi', 'math', 'eng', 'other']
  const subjectLabels: Record<string, string> = { chi: 'ภาษาจีน', math: 'คณิตศาสตร์', eng: 'อังกฤษ', other: 'อื่นๆ' }
  const subjectPalette: Record<string, string> = { chi: '#FB7185', math: '#FBBF24', eng: '#38BDF8', other: '#A78BFA' }
  const subjectRevenue: Record<string, number> = { chi: 0, math: 0, eng: 0, other: 0 }
  ;(receiptsThisMonth ?? []).forEach((r: any) => {
    const subjectStr = String(r.subject ?? '').toLowerCase()
    const courseName = String((r.enrollment as any)?.course?.name ?? '').toLowerCase()
    const s = subjectStr || courseName
    const amt = Number(r.amount ?? 0)
    const book = Number(r.book_fee ?? 0)
    if (s.includes('chi') || s.includes('จีน') || s.includes('hsk') || s.includes('yct') || s.includes('chinese')) subjectRevenue.chi += amt
    else if (s.includes('math') || s.includes('คณิต') || s.includes('maths')) subjectRevenue.math += amt
    else if (s.includes('eng') || s.includes('อังกฤษ') || s.includes('english') || s.includes('phonics') || s.includes('conversation') || s.includes('basic')) subjectRevenue.eng += amt
    else subjectRevenue.other += amt
    if (book > 0) subjectRevenue.other += book
  })

  const pieData = subjects
    .map(s => ({ key: s, label: subjectLabels[s], value: subjectRevenue[s], color: subjectPalette[s] }))
    .filter(d => d.value > 0)
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)

  // สร้าง donut ด้วยเทคนิค stroke-dasharray (รองรับ segment เดียวเต็มวงด้วย)
  const RR = 48
  const CIRC = 2 * Math.PI * RR
  let dashOffsetAcc = 0
  const pieSegments = pieData.map(d => {
    const len = pieTotal > 0 ? (d.value / pieTotal) * CIRC : 0
    const seg = { color: d.color, dasharray: `${len} ${CIRC - len}`, dashoffset: -dashOffsetAcc }
    dashOffsetAcc += len
    return seg
  })

  const expiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 5)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

  const urgentExpiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 1)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

  // การ์ดการเงินสีสด
  const financeCards = [
    { label: 'รายรับเดือนนี้', value: formatThaiMoney(revenueThisMonth), sub: `${currentMonth} · ${revenuePct >= 0 ? '↑' : '↓'} ${Math.abs(revenuePct)}%`, gradient: 'linear-gradient(135deg,#0d9488,#14b8a6)', href: '/staff/receipts' },
    { label: 'รายจ่ายเดือนนี้', value: formatThaiMoney(expensesTotal), sub: currentMonth, gradient: 'linear-gradient(135deg,#e11d48,#fb7185)', href: '/staff/expenses' },
    { label: profitThisMonth >= 0 ? 'กำไรเดือนนี้' : 'ขาดทุนเดือนนี้', value: `${profitThisMonth >= 0 ? '+' : ''}${formatThaiMoney(profitThisMonth)}`, sub: 'รายรับ − รายจ่าย', gradient: profitThisMonth >= 0 ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#dc2626,#f87171)', href: '/staff/settings' },
    { label: 'เงินคงเหลือปัจจุบัน', value: formatThaiMoney(cashBalance), sub: `อ้างอิง ${formatDate(anchorDate, 'd MMM yy')}`, gradient: 'linear-gradient(135deg,#4f46e5,#818cf8)', href: '/staff/settings' },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">สวัสดีครับ {profile?.full_name} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <DashboardExport />
          <Link href="/staff/settings" className="btn-brand text-sm">💰 Finance</Link>
          <Link href="/staff/import" className="btn-brand text-sm">📥 Download file</Link>
        </div>
      </div>

      {/* ═══ การเงิน ═══ */}
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">💰 การเงิน</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        {financeCards.map((c, i) => (
          <Link key={i} href={c.href} className="rounded-2xl p-4 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all" style={{ background: c.gradient }}>
            <div className="text-[11px] md:text-xs font-medium opacity-90 mb-1.5">{c.label}</div>
            <div className="text-lg md:text-2xl font-bold leading-tight">{c.value}</div>
            <div className="text-[10px] md:text-[11px] opacity-80 mt-1">{c.sub}</div>
          </Link>
        ))}
      </div>

      {/* กราฟวงกลมรายได้แต่ละวิชา */}
      <div className="card p-5 mb-8">
        <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-4">รายได้แยกตามวิชาเดือนนี้</h3>
        {pieTotal === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">ยังไม่มีรายได้เดือนนี้</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut */}
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 120 120" width="150" height="150">
                <g transform="rotate(-90 60 60)">
                  {pieSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="60" cy="60" r={RR}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeDasharray={seg.dasharray}
                      strokeDashoffset={seg.dashoffset}
                    />
                  ))}
                </g>
                <text x="60" y="55" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" style={{ fontSize: '9px' }}>รวมเดือนนี้</text>
                <text x="60" y="70" textAnchor="middle" className="fill-gray-800 dark:fill-gray-100" style={{ fontSize: '13px', fontWeight: 700 }}>
                  {formatThaiMoney(pieTotal)}
                </text>
              </svg>
            </div>
            {/* Legend */}
            <div className="flex-1 w-full space-y-2.5">
              {pieData.map(d => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{d.label}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatThaiMoney(d.value)}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right">{Math.round((d.value / pieTotal) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ นักเรียน ═══ */}
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">👥 นักเรียน</h2>
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
        <Link href="/staff/students" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">นักเรียนทั้งหมด</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-2xl font-semibold text-brand-600">{totalStudents ?? 0}</div>
          <div className="text-xs mt-1 text-gray-400 dark:text-gray-500">คน (Active)</div>
        </Link>
        <Link href="/staff/students" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">คอร์สกำลังเรียน</span>
            <span className="text-lg">📚</span>
          </div>
          <div className="text-2xl font-semibold text-brand-600">{activeEnrollments ?? 0}</div>
          <div className="text-xs mt-1 text-gray-400 dark:text-gray-500">enrollment</div>
        </Link>
      </div>

      {/* ═══ เช็คอิน ═══ */}
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">🕐 เช็คอิน</h2>
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="font-medium text-gray-800 dark:text-gray-100">เช็กอินวันนี้</h3>
          <Link href="/staff/checkin" className="text-xs text-brand-600 hover:underline">จัดการ →</Link>
        </div>
        {!(recentCheckins ?? []).length ? (
          <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีการเช็กอินวันนี้</p>
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {(recentCheckins ?? []).map((c: any) => (
              <Link href="/staff/checkin" key={c.id} className="flex items-center gap-2 bg-brand-50 dark:bg-[#1e3a4a] rounded-lg px-3 py-2 hover:bg-brand-100 dark:hover:bg-[#2a4a5a] transition">
                <div className="w-6 h-6 rounded-full bg-brand-200 dark:bg-brand-700 flex items-center justify-center text-brand-700 dark:text-white text-[10px] font-bold">
                  {((c.student?.nickname || c.student?.full_name || '?')).slice(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-medium text-brand-800 dark:text-gray-100">{c.student?.nickname || c.student?.full_name}</div>
                  <div className="text-[10px] text-brand-600 dark:text-brand-300">
                    {new Date(c.check_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
                    {!c.check_out_at && ' (ยังอยู่)'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ═══ ใกล้หมดคอร์ส ═══ */}
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">⚠️ ใกล้หมดคอร์ส</h2>
      <div className="card">
        <div className="card-header">
          <h3 className="font-medium text-gray-800 dark:text-gray-100">
            ใกล้หมดคอร์ส (เหลือ ≤1 ครั้ง) · <span className="text-brand-600">{expiring.length} คนต้องต่อ</span>
          </h3>
          <Link href="/staff/alerts" className="text-xs text-brand-600 hover:underline">จัดการ →</Link>
        </div>
        {urgentExpiring.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">ไม่มีคอร์สที่ใกล้หมด 🎉</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#3a4560]">
            {urgentExpiring.map((e: any) => {
              const remaining = e.lessons_total - e.lessons_used
              const name = e.student?.nickname || e.student?.full_name
              return (
                <Link href="/staff/checkin" key={e.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2a3245] transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">
                      {(name || '?').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{e.course?.name}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ${remaining <= 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {remaining <= 0 ? 'หมดแล้ว' : `เหลือ ${remaining} ครั้ง`}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
