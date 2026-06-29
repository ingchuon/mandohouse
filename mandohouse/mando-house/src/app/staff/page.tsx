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

  // วันปัจจุบันในเขตเวลาไทย (UTC+7)
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
    { data: allReceipts },
    { data: monthlyBalance },
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
    supabase.from('receipts').select('amount'),
    supabase.from('monthly_balance')
      .select('carry_over, total_carry_over')
      .eq('month', currentMonth)
      .single(),
    supabase.from('expenses').select('amount').gte('expense_date', firstOfMonth),
    supabase.from('cash_balance_settings').select('anchor_date, anchor_amount').eq('id', 1).single(),
    // ยอดหลังวัน anchor — ใช้คำนวณเงินคงเหลือปัจจุบัน
    supabase.from('receipts').select('amount, issued_at'),
    supabase.from('expenses').select('amount, expense_date'),
  ])

  const revenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  // แยกยอดค่าหนังสือ vs ค่าคอร์ส จากใบเสร็จเดือนนี้ (book_fee = ส่วนที่เป็นค่าหนังสือในใบเสร็จนั้น)
  const bookRevenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + Number(r.book_fee ?? 0), 0) ?? 0
  const courseRevenueThisMonth = revenueThisMonth - bookRevenueThisMonth
  const revenueLastMonth = receiptsLastMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const totalAllRevenueFromDB = allReceipts?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const carryOver = (monthlyBalance as any)?.carry_over ?? 0
  const totalCarryOver = Number((monthlyBalance as any)?.total_carry_over ?? 0)
  // รายได้ทั้งหมด = total_carry_over (ยอดก่อน import) + รายรับที่บันทึกในระบบหลังจากนั้น
  // ใช้ totalAllRevenueFromDB เสมอเพราะ receipts table มีข้อมูลครบแล้ว
  const totalAllRevenue = totalAllRevenueFromDB > totalCarryOver ? totalAllRevenueFromDB : totalCarryOver + revenueThisMonth
  const revenuePct = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0

  // รายจ่ายเดือนนี้
  const expensesTotal = expensesThisMonth?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0

  // กำไร/ขาดทุนเดือนนี้ = รายรับรวม (receipts) - รายจ่าย
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

  const subjects = ['chi', 'math', 'eng', 'other']
  const subjectLabels: Record<string, string> = { chi: 'ภาษาจีน', math: 'คณิตศาสตร์', eng: 'อังกฤษ', other: 'อื่นๆ' }
  const subjectColors: Record<string, string> = { chi: '#FF82A9', math: '#FF82A9', eng: '#FF82A9', other: '#FF82A9' }

  const subjectRevenue: Record<string, number> = { chi: 0, math: 0, eng: 0, other: 0 }
  ;(receiptsThisMonth ?? []).forEach((r: any) => {
    // ดูจาก subject ก่อน ถ้าว่างให้ดูจากชื่อ course
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
  const maxSubject = Math.max(...Object.values(subjectRevenue), 1)

  const expiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 5)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

  // นักเรียนใกล้หมดคอร์สมาก (เหลือ ≤1 ครั้ง) — โชว์ในหน้าแดชบอร์ด
  const urgentExpiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 1)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">สวัสดีครับ {profile?.full_name} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <DashboardExport />
          <a href="/teach" target="_blank" rel="noopener noreferrer" className="btn-brand text-sm">
            🧑‍🏫 หน้าครูกรอกข้อมูล →
          </a>
          <Link href="/staff/settings" className="btn-brand text-sm">⚙️ ตั้งค่ายอดเงิน</Link>
          <Link href="/staff/import" className="btn-brand text-sm">📤 Import ข้อมูล</Link>
        </div>
      </div>

      {/* ยอดสรุปการเงิน */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2">💰 รายได้ทั้งหมด</div>
          <div className="text-lg md:text-xl font-semibold text-brand-600">{formatThaiMoney(totalAllRevenue)}</div>
          <div className="text-xs text-gray-400 mt-1">ตั้งแต่เปิดกิจการ</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2">↩️ ยกยอดจากเดือนที่แล้ว</div>
          <div className="text-lg md:text-xl font-semibold text-brand-600">{formatThaiMoney(carryOver)}</div>
          <div className="text-xs text-gray-400 mt-1">
            <Link href="/staff/settings" className="text-brand-500 hover:underline">แก้ไข →</Link>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2">📊 รายรับสะสมเดือนนี้</div>
          <div className="text-lg md:text-xl font-semibold text-brand-600">{formatThaiMoney(revenueThisMonth)}</div>
          <div className={`text-xs mt-1 ${revenuePct >= 0 ? 'text-brand-500' : 'text-accent-700'}`}>
            {revenuePct >= 0 ? '↑' : '↓'} {Math.abs(revenuePct)}% จากเดือนก่อน
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2">🏦 เงินคงเหลือปัจจุบัน</div>
          <div className="text-lg md:text-xl font-semibold text-brand-600">{formatThaiMoney(cashBalance)}</div>
          <div className="text-xs text-gray-400 mt-1">
            อ้างอิงยอด {formatThaiMoney(anchorAmount)} ณ {formatDate(anchorDate, 'd MMM yyyy')}
          </div>
        </div>
      </div>

      {/* รายรับ / รายจ่าย / กำไรขาดทุน เดือนนี้ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link href="/staff/receipts" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="text-xs text-gray-500 mb-2">📥 รายรับค่าคอร์ส</div>
          <div className="text-lg md:text-xl font-semibold text-brand-600">{formatThaiMoney(courseRevenueThisMonth)}</div>
          <div className="text-xs text-gray-400 mt-1">{currentMonth}</div>
        </Link>
        <Link href="/staff/books" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="text-xs text-gray-500 mb-2">📚 รายรับขายหนังสือ</div>
          <div className="text-lg md:text-xl font-semibold text-brand-600">{formatThaiMoney(bookRevenueThisMonth)}</div>
          <div className="text-xs text-gray-400 mt-1">{currentMonth}</div>
        </Link>
        <Link href="/staff/expenses" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="text-xs text-gray-500 mb-2">📤 รายจ่ายเดือนนี้</div>
          <div className="text-lg md:text-xl font-semibold text-red-500">{formatThaiMoney(expensesTotal)}</div>
          <div className="text-xs text-gray-400 mt-1">{currentMonth}</div>
        </Link>
        <div className="card p-4" style={{ background: profitThisMonth >= 0 ? '#ECFDF5' : '#FEF2F2' }}>
          <div className="text-xs text-gray-500 mb-2">{profitThisMonth >= 0 ? '📈' : '📉'} กำไร/ขาดทุนเดือนนี้</div>
          <div className={`text-lg md:text-xl font-semibold ${profitThisMonth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {profitThisMonth >= 0 ? '+' : ''}{formatThaiMoney(profitThisMonth)}
          </div>
          <div className="text-xs text-gray-400 mt-1">รายรับ − รายจ่าย</div>
        </div>
      </div>

      {/* กราฟวิชา (full width) */}
      <div className="card p-5 mb-6">
        <h3 className="font-medium text-gray-800 mb-4">📊 รายได้แยกตามวิชาเดือนนี้</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {subjects.map(s => (
            <div key={s}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 text-xs">{subjectLabels[s]}</span>
                <span className="font-medium text-xs" style={{ color: subjectColors[s] }}>
                  {formatThaiMoney(subjectRevenue[s])}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round((subjectRevenue[s] / maxSubject) * 100)}%`, background: subjectColors[s] }} />
              </div>
              <div className="text-[10px] text-gray-400 text-right mt-0.5">
                {revenueThisMonth > 0 ? Math.round((subjectRevenue[s] / revenueThisMonth) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 md:mb-6">
        <Link href="/staff/students" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">นักเรียนทั้งหมด</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-2xl font-semibold text-brand-600">{totalStudents ?? 0}</div>
          <div className="text-xs mt-1 text-gray-400">คน (Active)</div>
        </Link>

        <Link href="/staff/students" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">คอร์สกำลังเรียน</span>
            <span className="text-lg">📚</span>
          </div>
          <div className="text-2xl font-semibold text-brand-600">{activeEnrollments ?? 0}</div>
          <div className="text-xs mt-1 text-gray-400">enrollment</div>
        </Link>

        <Link href="/staff/alerts" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">ใกล้หมดคอร์ส</span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="text-2xl font-semibold text-brand-600">{expiring.length}</div>
          <div className={`text-xs mt-1 ${expiring.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>ต้องต่อคอร์ส</div>
        </Link>

        <Link href="/staff/receipts" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">รายรับสะสมเดือนนี้</span>
            <span className="text-lg">📊</span>
          </div>
          <div className="text-2xl font-semibold text-brand-600">{formatThaiMoney(revenueThisMonth)}</div>
          <div className="text-xs mt-1 text-brand-600">
            {receiptsThisMonth?.length ?? 0} ใบเสร็จ
          </div>
        </Link>
      </div>

      <div className="card mt-5">
        <div className="card-header">
          <h3 className="font-medium text-gray-800">เช็กอินวันนี้</h3>
          <Link href="/staff/checkin" className="text-xs text-brand-600 hover:underline">จัดการ →</Link>
        </div>
        {!(recentCheckins ?? []).length ? (
          <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีการเช็กอินวันนี้</p>
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {(recentCheckins ?? []).map((c: any) => (
              <Link href="/staff/checkin" key={c.id} className="flex items-center gap-2 bg-brand-50 rounded-lg px-3 py-2 hover:bg-brand-100 transition">
                <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-[10px] font-bold">
                  {((c.student?.nickname || c.student?.full_name || '?')).slice(0,2)}
                </div>
                <div>
                  <div className="text-xs font-medium text-brand-800">{c.student?.nickname || c.student?.full_name}</div>
                  <div className="text-[10px] text-brand-600">
                    {new Date(c.check_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
                    {!c.check_out_at && ' (ยังอยู่)'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* นักเรียนใกล้หมดคอร์ส (เหลือ ≤1 ครั้ง) */}
      <div className="card mt-5">
        <div className="card-header">
          <h3 className="font-medium text-gray-800">⚠️ ใกล้หมดคอร์ส (เหลือ ≤1 ครั้ง)</h3>
          <Link href="/staff/lessons" className="text-xs text-brand-600 hover:underline">จัดการ →</Link>
        </div>
        {urgentExpiring.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">ไม่มีคอร์สที่ใกล้หมด 🎉</p>
        ) : (
          <div className="divide-y divide-cream-200">
            {urgentExpiring.map((e: any) => {
              const remaining = e.lessons_total - e.lessons_used
              const name = e.student?.nickname || e.student?.full_name
              return (
                <Link href="/staff/lessons" key={e.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-cream-200/50 transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold flex-shrink-0">
                      {(name || '?').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{name}</div>
                      <div className="text-xs text-gray-400 truncate">{e.course?.name}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ${remaining <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
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
