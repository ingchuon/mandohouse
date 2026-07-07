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

  const nowTH   = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
  const today   = nowTH.toISOString().split('T')[0]
  const todayStart = today + 'T00:00:00+07:00'
  const todayEnd   = today + 'T23:59:59+07:00'
  const firstOfMonth     = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth  = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
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
    supabase.from('enrollments').select('*, student:students(nickname,full_name), course:courses(name)').eq('status', 'active'),
    supabase.from('checkins').select('*, student:students(nickname,full_name)').gte('check_in_at', todayStart).lte('check_in_at', todayEnd).order('check_in_at', { ascending: false }).limit(8),
    supabase.from('expenses').select('amount').gte('expense_date', firstOfMonth),
    supabase.from('cash_balance_settings').select('anchor_date, anchor_amount').eq('id', 1).single(),
    supabase.from('receipts').select('amount, issued_at'),
    supabase.from('expenses').select('amount, expense_date'),
  ])

  const revenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenueLastMonth = receiptsLastMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenuePct = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0
  const expensesTotal    = expensesThisMonth?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0
  const profitThisMonth  = revenueThisMonth - expensesTotal

  const anchorDate   = (cashBalanceSettings as any)?.anchor_date ?? today
  const anchorAmount = Number((cashBalanceSettings as any)?.anchor_amount ?? 0)
  const receiptsSinceAnchor = (receiptsAfterAnchor ?? []).filter((r: any) => r.issued_at > anchorDate).reduce((s: number, r: any) => s + Number(r.amount), 0)
  const expensesSinceAnchor = (expensesAfterAnchor ?? []).filter((e: any) => e.expense_date > anchorDate).reduce((s: number, e: any) => s + Number(e.amount), 0)
  const cashBalance = anchorAmount + receiptsSinceAnchor - expensesSinceAnchor

  // รายได้แยกวิชา — สำหรับ donut
  const subjectPalette: Record<string, string> = { chi: '#FB7185', math: '#FBBF24', eng: '#38BDF8', other: '#A78BFA' }
  const subjectLabels:  Record<string, string> = { chi: 'จีน', math: 'คณิต', eng: 'อังกฤษ', other: 'อื่นๆ' }
  const subjectRevenue: Record<string, number> = { chi: 0, math: 0, eng: 0, other: 0 }
  ;(receiptsThisMonth ?? []).forEach((r: any) => {
    const s = String(r.subject ?? (r.enrollment as any)?.course?.name ?? '').toLowerCase()
    const amt = Number(r.amount ?? 0)
    if (s.includes('จีน') || s.includes('chi') || s.includes('hsk') || s.includes('yct')) subjectRevenue.chi += amt
    else if (s.includes('คณิต') || s.includes('math')) subjectRevenue.math += amt
    else if (s.includes('อังกฤษ') || s.includes('eng') || s.includes('phonics')) subjectRevenue.eng += amt
    else subjectRevenue.other += amt
    subjectRevenue.other += Number(r.book_fee ?? 0)
  })
  const pieData = Object.entries(subjectRevenue).filter(([, v]) => v > 0).map(([k, v]) => ({ key: k, label: subjectLabels[k], value: v, color: subjectPalette[k] }))
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)
  const RR = 44; const CIRC = 2 * Math.PI * RR
  let acc = 0
  const pieSegments = pieData.map(d => {
    const len = pieTotal > 0 ? (d.value / pieTotal) * CIRC : 0
    const seg = { color: d.color, dasharray: `${len} ${CIRC - len}`, dashoffset: -acc }
    acc += len; return seg
  })

  const urgentExpiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 1)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))
    .slice(0, 6)

  return (
    <div className="p-3 md:p-5 h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">สวัสดีครับ {profile?.full_name} 👋</h1>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <DashboardExport />
          <Link href="/staff/settings" className="btn-brand text-xs py-1.5 px-3">💰 Finance</Link>
          <Link href="/staff/import"   className="btn-brand text-xs py-1.5 px-3">📥 Export</Link>
        </div>
      </div>

      {/* ── แถว 1: การ์ด 6 ใบ ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-3">

        {/* รายรับ — ฟ้า */}
        <Link href="/staff/receipts"
          className="col-span-1 rounded-2xl p-3 text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#0284c7,#38bdf8)' }}>
          <div className="text-[10px] font-medium opacity-80 mb-1">💙 รายรับ</div>
          <div className="text-sm md:text-base font-bold truncate">{formatThaiMoney(revenueThisMonth)}</div>
          <div className="text-[9px] opacity-70 mt-0.5">{revenuePct >= 0 ? '▲' : '▼'} {Math.abs(revenuePct)}% จากเดือนก่อน</div>
        </Link>

        {/* รายจ่าย — เหลือง */}
        <Link href="/staff/expenses"
          className="col-span-1 rounded-2xl p-3 text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}>
          <div className="text-[10px] font-medium opacity-80 mb-1">💛 รายจ่าย</div>
          <div className="text-sm md:text-base font-bold truncate">{formatThaiMoney(expensesTotal)}</div>
          <div className="text-[9px] opacity-70 mt-0.5">{currentMonth}</div>
        </Link>

        {/* กำไร/ขาดทุน */}
        <Link href="/staff/settings"
          className="col-span-1 rounded-2xl p-3 text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: profitThisMonth >= 0 ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#dc2626,#f87171)' }}>
          <div className="text-[10px] font-medium opacity-80 mb-1">{profitThisMonth >= 0 ? '📈 กำไร' : '📉 ขาดทุน'}</div>
          <div className="text-sm md:text-base font-bold truncate">{profitThisMonth >= 0 ? '+' : ''}{formatThaiMoney(profitThisMonth)}</div>
          <div className="text-[9px] opacity-70 mt-0.5">รายรับ − รายจ่าย</div>
        </Link>

        {/* เงินคงเหลือ */}
        <Link href="/staff/settings"
          className="col-span-1 rounded-2xl p-3 text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)' }}>
          <div className="text-[10px] font-medium opacity-80 mb-1">💰 คงเหลือ</div>
          <div className="text-sm md:text-base font-bold truncate">{formatThaiMoney(cashBalance)}</div>
          <div className="text-[9px] opacity-70 mt-0.5">อ้างอิง {formatDate(anchorDate, 'd MMM yy')}</div>
        </Link>

        {/* นักเรียน */}
        <Link href="/staff/students"
          className="col-span-1 rounded-2xl p-3 text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
          <div className="text-[10px] font-medium opacity-80 mb-1">👥 นักเรียน</div>
          <div className="text-sm md:text-base font-bold">{totalStudents ?? 0} <span className="text-[11px] font-normal opacity-80">คน</span></div>
          <div className="text-[9px] opacity-70 mt-0.5">Active</div>
        </Link>

        {/* คอร์ส */}
        <Link href="/staff/students"
          className="col-span-1 rounded-2xl p-3 text-white shadow-sm hover:-translate-y-0.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#c084fc)' }}>
          <div className="text-[10px] font-medium opacity-80 mb-1">📚 คอร์ส</div>
          <div className="text-sm md:text-base font-bold">{activeEnrollments ?? 0} <span className="text-[11px] font-normal opacity-80">คอร์ส</span></div>
          <div className="text-[9px] opacity-70 mt-0.5">กำลังเรียน</div>
        </Link>
      </div>

      {/* ── แถว 2: กราฟ + เช็กอิน + ใกล้หมด (3 คอลัมน์) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* กราฟวงกลม */}
        <div className="card p-4">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">📊 รายได้ตามวิชา</div>
          {pieTotal === 0 ? (
            <p className="text-center text-gray-300 text-xs py-8">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 100 100" width="88" height="88" className="flex-shrink-0">
                <g transform="rotate(-90 50 50)">
                  {pieSegments.map((seg, i) => (
                    <circle key={i} cx="50" cy="50" r={RR} fill="none"
                      stroke={seg.color} strokeWidth="18"
                      strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset} />
                  ))}
                </g>
                <text x="50" y="46" textAnchor="middle" style={{ fontSize: '7px', fill: '#9ca3af' }}>รวม</text>
                <text x="50" y="57" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 700, fill: '#1f2937' }}>{formatThaiMoney(pieTotal)}</text>
              </svg>
              <div className="flex-1 space-y-1.5">
                {pieData.map(d => (
                  <div key={d.key} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-[11px] text-gray-600 dark:text-gray-300 flex-1 truncate">{d.label}</span>
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{Math.round((d.value / pieTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* เช็กอินวันนี้ */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">🕐 เช็กอินวันนี้</div>
            <Link href="/staff/checkin" className="text-[10px] text-brand-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {!(recentCheckins ?? []).length ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-2xl mb-1">😴</div>
              <p className="text-xs text-gray-400">ยังไม่มีการเช็กอิน</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {(recentCheckins ?? []).map((c: any) => (
                <Link href="/staff/checkin" key={c.id}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-[#2a3245] transition">
                  <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-700 dark:text-white text-[10px] font-bold flex-shrink-0">
                    {(c.student?.nickname || c.student?.full_name || '?').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{c.student?.nickname || c.student?.full_name}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(c.check_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
                    </div>
                  </div>
                  {!c.check_out_at && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="ยังอยู่" />}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ใกล้หมดคอร์ส */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">⚠️ ใกล้หมดคอร์ส</div>
            <Link href="/staff/alerts" className="text-[10px] text-brand-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {urgentExpiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-2xl mb-1">🎉</div>
              <p className="text-xs text-gray-400">ไม่มีคอร์สที่ใกล้หมด</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {urgentExpiring.map((e: any) => {
                const remaining = e.lessons_total - e.lessons_used
                const name = e.student?.nickname || e.student?.full_name || '?'
                return (
                  <Link href="/staff/checkin" key={e.id}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-[#2a3245] transition">
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 text-[10px] font-bold flex-shrink-0">
                      {name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{e.course?.name}</div>
                    </div>
                    <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full ${remaining <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {remaining <= 0 ? 'หมด' : `${remaining} ครั้ง`}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
