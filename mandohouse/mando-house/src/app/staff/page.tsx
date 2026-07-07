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

  const nowTH  = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
  const today  = nowTH.toISOString().split('T')[0]
  const todayStart = today + 'T00:00:00+07:00'
  const todayEnd   = today + 'T23:59:59+07:00'
  const currentYear  = new Date().getFullYear()
  const currentMonthN = new Date().getMonth()
  const currentMonth = `${currentYear}-${String(currentMonthN + 1).padStart(2, '0')}`
  const firstOfMonth = new Date(currentYear, currentMonthN, 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(currentYear, currentMonthN - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth  = new Date(currentYear, currentMonthN, 0).toISOString().split('T')[0]

  // สร้าง 6 เดือนย้อนหลัง
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonthN - 5 + i, 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()],
      firstDay: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
      lastDay:  new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
    }
  })

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
    { data: allReceipts6m },
    { data: allExpenses6m },
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
    supabase.from('receipts').select('amount, issued_at').gte('issued_at', last6Months[0].firstDay),
    supabase.from('expenses').select('amount, expense_date').gte('expense_date', last6Months[0].firstDay),
  ])

  const revenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenueLastMonth = receiptsLastMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenuePct = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0
  const expensesTotal   = expensesThisMonth?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0
  const profitThisMonth = revenueThisMonth - expensesTotal

  const anchorDate   = (cashBalanceSettings as any)?.anchor_date ?? today
  const anchorAmount = Number((cashBalanceSettings as any)?.anchor_amount ?? 0)
  const receiptsSinceAnchor = (receiptsAfterAnchor ?? []).filter((r: any) => r.issued_at > anchorDate).reduce((s: number, r: any) => s + Number(r.amount), 0)
  const expensesSinceAnchor = (expensesAfterAnchor ?? []).filter((e: any) => e.expense_date > anchorDate).reduce((s: number, e: any) => s + Number(e.amount), 0)
  const cashBalance = anchorAmount + receiptsSinceAnchor - expensesSinceAnchor

  // กราฟ 6 เดือน
  const chartData = last6Months.map(m => {
    const rev = (allReceipts6m ?? []).filter((r: any) => String(r.issued_at ?? '').slice(0, 7) === m.key).reduce((s: number, r: any) => s + Number(r.amount), 0)
    const exp = (allExpenses6m ?? []).filter((e: any) => String(e.expense_date ?? '').slice(0, 7) === m.key).reduce((s: number, e: any) => s + Number(e.amount), 0)
    return { ...m, rev, exp }
  })
  const chartMax = Math.max(...chartData.flatMap(d => [d.rev, d.exp]), 1)

  // กราฟวงกลม
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

  // วาด donut ด้วย path arc (เต็มวง ไม่มีรอยโหว่)
  const CX = 50, CY = 50, R_OUT = 42, R_IN = 26
  function polar(r: number, deg: number): [number, number] {
    const a = (deg - 90) * Math.PI / 180
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
  }
  let angleAcc = 0
  const piePaths = pieData.map(d => {
    const start = angleAcc
    const sweep = pieTotal > 0 ? (d.value / pieTotal) * 360 : 0
    let end = start + sweep
    angleAcc = end
    // กันกรณี segment เดียว 360° (path arc วาดไม่ได้) ให้หดนิดนึง
    if (sweep >= 359.999) end = start + 359.999
    const large = sweep > 180 ? 1 : 0
    const [x1, y1] = polar(R_OUT, start)
    const [x2, y2] = polar(R_OUT, end)
    const [x3, y3] = polar(R_IN, end)
    const [x4, y4] = polar(R_IN, start)
    const path = `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} L ${x3.toFixed(3)} ${y3.toFixed(3)} A ${R_IN} ${R_IN} 0 ${large} 0 ${x4.toFixed(3)} ${y4.toFixed(3)} Z`
    return { path, color: d.color }
  })

  const urgentExpiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 1)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))
    .slice(0, 6)

  return (
    <div className="p-3 md:p-5 flex flex-col gap-3 min-h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
            สวัสดีครับ {profile?.full_name} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <DashboardExport />
      </div>

      {/* ── แถว 1: การ์ดการเงิน 4 ใบ ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '💙 รายรับ',  value: formatThaiMoney(revenueThisMonth), sub: `${revenuePct >= 0 ? '▲' : '▼'} ${Math.abs(revenuePct)}% จากเดือนก่อน`, bg: 'linear-gradient(135deg,#0284c7,#38bdf8)', href: '/staff/receipts' },
          { label: '💛 รายจ่าย', value: formatThaiMoney(expensesTotal),    sub: currentMonth,   bg: 'linear-gradient(135deg,#d97706,#fbbf24)', href: '/staff/expenses' },
          { label: profitThisMonth >= 0 ? '📈 กำไร' : '📉 ขาดทุน',
            value: `${profitThisMonth >= 0 ? '+' : ''}${formatThaiMoney(profitThisMonth)}`,
            sub: 'รายรับ − รายจ่าย',
            bg: profitThisMonth >= 0 ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#dc2626,#f87171)',
            href: '/staff/settings' },
          { label: '💰 คงเหลือ', value: formatThaiMoney(cashBalance), sub: `อ้างอิง ${formatDate(anchorDate, 'd MMM yy')}`, bg: 'linear-gradient(135deg,#4f46e5,#818cf8)', href: '/staff/settings' },
        ].map((c, i) => (
          <Link key={i} href={c.href}
            className="rounded-2xl p-4 md:p-5 text-white shadow-sm hover:-translate-y-0.5 transition-all"
            style={{ background: c.bg }}>
            <div className="text-xs font-medium opacity-80 mb-2">{c.label}</div>
            <div className="text-xl md:text-2xl font-bold truncate leading-tight">{c.value}</div>
            <div className="text-[10px] opacity-70 mt-1.5">{c.sub}</div>
          </Link>
        ))}
      </div>

      {/* ── แถว 2: กราฟแท่ง 6 เดือน ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">📊 รายรับ-รายจ่าย 6 เดือนล่าสุด</div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#38bdf8' }}></span>รายรับ</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fbbf24' }}></span>รายจ่าย</span>
          </div>
        </div>
        <div className="flex items-end gap-2 md:gap-4 h-32">
          {chartData.map((m, i) => {
            const revH = chartMax > 0 ? Math.round((m.rev / chartMax) * 100) : 0
            const expH = chartMax > 0 ? Math.round((m.exp / chartMax) * 100) : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 flex-1">
                  <div className="w-1/2 max-w-[28px] rounded-t-md"
                    style={{ height: `${revH}%`, background: '#38bdf8', minHeight: m.rev > 0 ? '4px' : '0' }}
                    title={`รายรับ: ${formatThaiMoney(m.rev)}`} />
                  <div className="w-1/2 max-w-[28px] rounded-t-md"
                    style={{ height: `${expH}%`, background: '#fbbf24', minHeight: m.exp > 0 ? '4px' : '0' }}
                    title={`รายจ่าย: ${formatThaiMoney(m.exp)}`} />
                </div>
                <div className="text-[10px] text-gray-400">{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── แถว 3: กราฟวงกลม + เช็กอิน + ใกล้หมดคอร์ส (ยืดเต็มความสูงที่เหลือ) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">

        {/* กราฟวงกลม */}
        <div className="card p-4 flex flex-col">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">🎯 รายได้ตามวิชาเดือนนี้</div>
          {pieTotal === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="text-2xl mb-1">📭</div>
              <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-1">
              <svg viewBox="0 0 100 100" width="110" height="110" className="flex-shrink-0">
                {piePaths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)}
                <circle cx={CX} cy={CY} r={R_IN - 0.5} className="fill-white dark:fill-[#242d3f]" />
                <text x={CX} y={CY - 2} textAnchor="middle" style={{ fontSize: '6px', fill: '#9ca3af' }}>รวมเดือนนี้</text>
                <text x={CX} y={CY + 7} textAnchor="middle" style={{ fontSize: '9px', fontWeight: 700 }} className="fill-gray-800 dark:fill-gray-100">
                  {formatThaiMoney(pieTotal)}
                </text>
              </svg>
              <div className="flex-1 space-y-2.5">
                {pieData.map(d => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{d.label}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{Math.round((d.value / pieTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* เช็กอินวันนี้ */}
        <div className="card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">🕐 เช็กอินวันนี้</div>
            <Link href="/staff/checkin" className="text-[10px] text-brand-600 hover:underline">จัดการ →</Link>
          </div>
          {!(recentCheckins ?? []).length ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="text-2xl mb-1">😴</div>
              <p className="text-xs text-gray-400">ยังไม่มีการเช็กอิน</p>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1">
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
                  {!c.check_out_at && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ใกล้หมดคอร์ส */}
        <div className="card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">⚠️ ใกล้หมดคอร์ส</div>
            <Link href="/staff/alerts" className="text-[10px] text-brand-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {urgentExpiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="text-2xl mb-1">🎉</div>
              <p className="text-xs text-gray-400">ไม่มีคอร์สที่ใกล้หมด</p>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1">
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
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${remaining <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
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
