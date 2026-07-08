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
  const yr = new Date().getFullYear()
  const mo = new Date().getMonth()
  const currentMonth     = `${yr}-${String(mo + 1).padStart(2, '0')}`
  const firstOfMonth     = new Date(yr, mo, 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(yr, mo - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth  = new Date(yr, mo, 0).toISOString().split('T')[0]

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(yr, mo - 5 + i, 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()],
    }
  })

  const [
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
    supabase.from('receipts').select('amount, subject, book_fee, enrollment:enrollments(course:courses(name))').gte('issued_at', firstOfMonth),
    supabase.from('receipts').select('amount').gte('issued_at', firstOfLastMonth).lte('issued_at', lastOfLastMonth),
    supabase.from('enrollments').select('*, student:students(nickname,full_name), course:courses(name)').eq('status', 'active'),
    supabase.from('checkins').select('*, student:students(nickname,full_name)').gte('check_in_at', todayStart).lte('check_in_at', todayEnd).order('check_in_at', { ascending: false }).limit(10),
    supabase.from('expenses').select('amount').gte('expense_date', firstOfMonth),
    supabase.from('cash_balance_settings').select('anchor_date, anchor_amount').eq('id', 1).single(),
    supabase.from('receipts').select('amount, issued_at'),
    supabase.from('expenses').select('amount, expense_date'),
    supabase.from('receipts').select('amount, issued_at').gte('issued_at', last6Months[0].key + '-01'),
    supabase.from('expenses').select('amount, expense_date').gte('expense_date', last6Months[0].key + '-01'),
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
  const chartData = last6Months.map(m => ({
    ...m,
    rev: (allReceipts6m ?? []).filter((r: any) => String(r.issued_at ?? '').slice(0, 7) === m.key).reduce((s: number, r: any) => s + Number(r.amount), 0),
    exp: (allExpenses6m ?? []).filter((e: any) => String(e.expense_date ?? '').slice(0, 7) === m.key).reduce((s: number, e: any) => s + Number(e.amount), 0),
  }))
  const chartMax = Math.max(...chartData.flatMap(d => [d.rev, d.exp]), 1)

  // กราฟวงกลม — path arc ไม่มีรอยโหว่
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
  const CX = 50, CY = 50, R_OUT = 46, R_IN = 28
  function polar(r: number, deg: number): [number, number] {
    const a = (deg - 90) * Math.PI / 180
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
  }
  let angleAcc = 0
  const piePaths = pieData.map(d => {
    const start = angleAcc
    const sweep = pieTotal > 0 ? (d.value / pieTotal) * 360 : 0
    let end = start + sweep; if (sweep >= 359.999) end = start + 359.999
    angleAcc = end
    const large = sweep > 180 ? 1 : 0
    const [x1,y1]=polar(R_OUT,start); const [x2,y2]=polar(R_OUT,end)
    const [x3,y3]=polar(R_IN,end);   const [x4,y4]=polar(R_IN,start)
    return { path: `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R_OUT} ${R_OUT} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${R_IN} ${R_IN} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`, color: d.color }
  })

  const urgentExpiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 1)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))
    .slice(0, 8)

  // สีธีม cream/yellow แต่เขียว→ฟ้า
  const cardBg = 'bg-white dark:bg-[#242d3f]'
  const sectionBorder = 'border border-[#F0E9D8] dark:border-[#2a3245]'

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4" style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--surface, #FAF7F2)' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">สวัสดีครับ {profile?.full_name} 👋</h1>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <DashboardExport />
      </div>

      {/* ── แถว 1: การ์ดการเงิน 4 ใบ ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'รายรับ',   value: formatThaiMoney(revenueThisMonth), sub: `${revenuePct >= 0 ? '▲' : '▼'} ${Math.abs(revenuePct)}%`, bg: 'bg-[#3B9EE0]', href: '/staff/receipts' },
          { label: 'รายจ่าย', value: formatThaiMoney(expensesTotal),     sub: currentMonth,              bg: 'bg-[#F5A623]', href: '/staff/expenses' },
          { label: profitThisMonth >= 0 ? 'กำไร' : 'ขาดทุน',
            value: `${profitThisMonth >= 0 ? '+' : ''}${formatThaiMoney(profitThisMonth)}`,
            sub: 'รายรับ − รายจ่าย',
            bg: profitThisMonth >= 0 ? 'bg-[#3BBFAD]' : 'bg-[#E05A5A]',
            href: '/staff/settings' },
          { label: 'คงเหลือ', value: formatThaiMoney(cashBalance), sub: `อ้างอิง ${formatDate(anchorDate, 'd MMM yy')}`, bg: 'bg-[#7C6FF7]', href: '/staff/settings' },
        ].map((c, i) => (
          <Link key={i} href={c.href}
            className={`${c.bg} rounded-2xl p-4 text-white shadow-sm hover:-translate-y-0.5 transition-all`}>
            <div className="text-xs font-medium opacity-80 mb-1">{c.label}</div>
            <div className="text-xl md:text-2xl font-bold truncate leading-tight">{c.value}</div>
            <div className="text-[10px] opacity-70 mt-1">{c.sub}</div>
          </Link>
        ))}
      </div>

      {/* ── แถว 2: กราฟแท่ง ── */}
      <div className={`${cardBg} ${sectionBorder} rounded-2xl p-4 shadow-sm`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">📊 รายรับ-รายจ่าย 6 เดือนล่าสุด</div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block bg-[#3B9EE0]"></span>รายรับ</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block bg-[#F5A623]"></span>รายจ่าย</span>
          </div>
        </div>
        <div className="flex items-end gap-2 md:gap-4 h-28">
          {chartData.map((m, i) => {
            const revH = chartMax > 0 ? Math.round((m.rev / chartMax) * 100) : 0
            const expH = chartMax > 0 ? Math.round((m.exp / chartMax) * 100) : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-0.5 flex-1">
                  <div className="w-5 rounded-t-lg" style={{ height: `${revH}%`, background: '#3B9EE0', minHeight: m.rev > 0 ? '4px' : '0' }} />
                  <div className="w-5 rounded-t-lg" style={{ height: `${expH}%`, background: '#F5A623', minHeight: m.exp > 0 ? '4px' : '0' }} />
                </div>
                <div className="text-[10px] text-gray-400">{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── แถว 3: กราฟวงกลม + เช็กอิน + ใกล้หมด ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* กราฟวงกลม — ใหญ่เต็มการ์ด */}
        <div className={`${cardBg} ${sectionBorder} rounded-2xl p-4 shadow-sm flex flex-col`}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🎯 รายได้ตามวิชาเดือนนี้</div>
          {pieTotal === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">📭</div>
              <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex items-center justify-center">
                <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: '220px', height: 'auto' }}>
                  {piePaths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)}
                  <circle cx={CX} cy={CY} r={R_IN - 1} fill="white" className="dark:fill-[#242d3f]" />
                  <text x={CX} y={CY - 3} textAnchor="middle" style={{ fontSize: '5.5px', fill: '#9ca3af' }}>รวมเดือนนี้</text>
                  <text x={CX} y={CY + 6} textAnchor="middle" style={{ fontSize: '8px', fontWeight: 700 }} className="fill-gray-800 dark:fill-gray-100">{formatThaiMoney(pieTotal)}</text>
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-gray-100 dark:border-[#2a3245]">
                {pieData.map(d => (
                  <div key={d.key} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{d.label}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-100">{Math.round((d.value / pieTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* เช็กอิน */}
        <div className={`${cardBg} ${sectionBorder} rounded-2xl p-4 shadow-sm flex flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">🕐 เช็กอินวันนี้</div>
            <Link href="/staff/checkin" className="text-[11px] text-[#3B9EE0] hover:underline font-medium">จัดการ →</Link>
          </div>
          {!(recentCheckins ?? []).length ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">😴</div>
              <p className="text-xs text-gray-400">ยังไม่มีการเช็กอิน</p>
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto flex-1">
              {(recentCheckins ?? []).map((c: any) => (
                <Link href="/staff/checkin" key={c.id}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-[#FAF7F2] dark:hover:bg-[#2a3245] transition">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#3B9EE0' }}>
                    {(c.student?.nickname || c.student?.full_name || '?').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{c.student?.nickname || c.student?.full_name}</div>
                    <div className="text-[10px] text-gray-400">{new Date(c.check_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.</div>
                  </div>
                  {!c.check_out_at && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ใกล้หมดคอร์ส */}
        <div className={`${cardBg} ${sectionBorder} rounded-2xl p-4 shadow-sm flex flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">⚠️ ใกล้หมดคอร์ส</div>
            <Link href="/staff/alerts" className="text-[11px] text-[#3B9EE0] hover:underline font-medium">ดูทั้งหมด →</Link>
          </div>
          {urgentExpiring.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-3xl mb-1">🎉</div>
              <p className="text-xs text-gray-400">ไม่มีคอร์สที่ใกล้หมด</p>
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto flex-1">
              {urgentExpiring.map((e: any) => {
                const remaining = e.lessons_total - e.lessons_used
                const name = e.student?.nickname || e.student?.full_name || '?'
                return (
                  <Link href="/staff/checkin" key={e.id}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-[#FAF7F2] dark:hover:bg-[#2a3245] transition">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 text-xs font-bold flex-shrink-0">
                      {name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{e.course?.name}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${remaining <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
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
