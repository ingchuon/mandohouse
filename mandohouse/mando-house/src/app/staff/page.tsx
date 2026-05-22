// src/app/staff/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatThaiMoney, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) return <div>ไม่พบ user: {error?.message}</div>

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const today = new Date().toISOString().split('T')[0]
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
    { data: recentReviews },
    { data: expensesThisMonth },
    { data: allReceipts },
    { data: monthlyBalance },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('receipts').select('amount, subject, book_fee').gte('issued_at', firstOfMonth),
    supabase.from('receipts').select('amount').gte('issued_at', firstOfLastMonth).lte('issued_at', lastOfLastMonth),
    supabase.from('enrollments')
      .select('*, student:students(nickname, full_name), course:courses(name)')
      .eq('status', 'active'),
    supabase.from('checkins')
      .select('*, student:students(nickname, full_name)')
      .gte('check_in_at', today)
      .order('check_in_at', { ascending: false })
      .limit(12),
    supabase.from('reviews')
      .select('*, student:students(nickname, full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('expenses')
      .select('amount')
      .gte('expense_date', firstOfMonth),
    supabase.from('receipts').select('amount'),
    supabase.from('monthly_balance')
      .select('carry_over, total_carry_over')
      .eq('month', currentMonth)
      .single(),
  ])

  const revenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const revenueLastMonth = receiptsLastMonth?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const totalExpenseThisMonth = expensesThisMonth?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0
  const totalAllRevenueFromDB = allReceipts?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0
  const carryOver = (monthlyBalance as any)?.carry_over ?? 0
  const totalCarryOver = Number((monthlyBalance as any)?.total_carry_over ?? 0)
  const totalAllRevenue = totalCarryOver > 0 ? totalCarryOver : totalAllRevenueFromDB
  const netThisMonth = revenueThisMonth - totalExpenseThisMonth
  const revenuePct = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0

  const subjects = ['chi', 'math', 'eng', 'other']
  const subjectLabels: Record<string, string> = { chi: 'ภาษาจีน 🇨🇳', math: 'คณิตศาสตร์ 📐', eng: 'อังกฤษ 🇬🇧', other: 'อื่นๆ' }
  const subjectColors: Record<string, string> = { chi: '#0F6E56', math: '#2563eb', eng: '#d97706', other: '#6b7280' }

  const subjectRevenue: Record<string, number> = { chi: 0, math: 0, eng: 0, other: 0 }
  ;(receiptsThisMonth ?? []).forEach((r: any) => {
    const s = String(r.subject ?? '').toLowerCase()
    if (s.includes('chi') || s.includes('จีน')) subjectRevenue.chi += Number(r.amount)
    else if (s.includes('math') || s.includes('คณิต')) subjectRevenue.math += Number(r.amount)
    else if (s.includes('eng') || s.includes('อังกฤษ')) subjectRevenue.eng += Number(r.amount)
    else subjectRevenue.other += Number(r.amount)
  })
  const maxSubject = Math.max(...Object.values(subjectRevenue), 1)

  const expiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 5)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">สวัสดีครับ {profile?.full_name} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/staff/settings" className="btn-outline text-sm">⚙️ ตั้งค่ายอดเงิน</Link>
          <Link href="/staff/import" className="btn-outline text-sm">📤 Import ข้อมูล</Link>
        </div>
      </div>

      {/* ยอดสรุปการเงิน */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2">💰 รายได้ทั้งหมด</div>
          <div className="text-xl font-semibold text-brand-600">{formatThaiMoney(totalAllRevenue)}</div>
          <div className="text-xs text-gray-400 mt-1">ตั้งแต่เปิดกิจการ</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2">↩️ ยกยอดจากเดือนที่แล้ว</div>
          <div className="text-xl font-semibold text-gray-700">{formatThaiMoney(carryOver)}</div>
          <div className="text-xs text-gray-400 mt-1">
            <Link href="/staff/settings" className="text-brand-500 hover:underline">แก้ไข →</Link>
          </div>
        </div>
        <Link href="/staff/receipts" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="text-xs text-gray-500 mb-2">📥 รายรับเดือนนี้</div>
          <div className="text-xl font-semibold text-brand-600">{formatThaiMoney(revenueThisMonth)}</div>
          <div className={`text-xs mt-1 ${revenuePct >= 0 ? 'text-brand-500' : 'text-red-400'}`}>
            {revenuePct >= 0 ? '↑' : '↓'} {Math.abs(revenuePct)}% จากเดือนก่อน
          </div>
        </Link>
        <Link href="/staff/expenses" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="text-xs text-gray-500 mb-2">📤 รายจ่ายเดือนนี้</div>
          <div className="text-xl font-semibold text-red-500">{formatThaiMoney(totalExpenseThisMonth)}</div>
          <div className="text-xs text-gray-400 mt-1">ค่าใช้จ่ายรวม</div>
        </Link>
      </div>

      {/* เงินคงเหลือ + กราฟวิชา */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="card p-5">
          <h3 className="font-medium text-gray-800 mb-4">💵 เงินคงเหลือเดือนนี้</h3>
          <div className={`text-3xl font-bold mb-2 ${netThisMonth >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {netThisMonth >= 0 ? '+' : ''}{formatThaiMoney(netThisMonth)}
          </div>
          <div className="text-xs text-gray-400 mb-4">รายรับ - รายจ่าย</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">ยกมา</span>
              <span className="font-medium">{formatThaiMoney(carryOver)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">+ รายรับ</span>
              <span className="font-medium text-brand-600">{formatThaiMoney(revenueThisMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">- รายจ่าย</span>
              <span className="font-medium text-red-500">{formatThaiMoney(totalExpenseThisMonth)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="font-medium">คงเหลือ</span>
              <span className={`font-bold ${(carryOver + netThisMonth) >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                {formatThaiMoney(carryOver + netThisMonth)}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-2 card p-5">
          <h3 className="font-medium text-gray-800 mb-4">📊 รายได้แยกตามวิชาเดือนนี้</h3>
          <div className="space-y-3">
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
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link href="/staff/students" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">นักเรียนทั้งหมด</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{totalStudents ?? 0}</div>
          <div className="text-xs mt-1 text-gray-400">คน (Active)</div>
        </Link>

        <Link href="/staff/students" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">คอร์สกำลังเรียน</span>
            <span className="text-lg">📚</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{activeEnrollments ?? 0}</div>
          <div className="text-xs mt-1 text-gray-400">enrollment</div>
        </Link>

        <Link href="/staff/alerts" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">ใกล้หมดคอร์ส</span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{expiring.length}</div>
          <div className={`text-xs mt-1 ${expiring.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>ต้องต่อคอร์ส</div>
        </Link>

        <Link href="/staff/expenses" className="card p-4 hover:shadow-md transition cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">กำไรสุทธิเดือนนี้</span>
            <span className="text-lg">📊</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{formatThaiMoney(netThisMonth)}</div>
          <div className={`text-xs mt-1 ${netThisMonth >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {revenueThisMonth > 0 ? Math.round((netThisMonth / revenueThisMonth) * 100) : 0}% margin
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">นักเรียนใกล้หมดคอร์ส</h3>
            <Link href="/staff/alerts" className="text-xs text-brand-600 hover:underline">แจ้งเตือนทั้งหมด →</Link>
          </div>
          <table className="w-full">
            <thead><tr><th>นักเรียน</th><th>คอร์ส</th><th>เหลือ</th><th>สถานะ</th><th></th></tr></thead>
            <tbody>
              {expiring.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-6 text-sm">ไม่มีนักเรียนใกล้หมดคอร์ส 🎉</td></tr>
              )}
              {expiring.map((e: any) => {
                const rem = e.lessons_total - e.lessons_used
                return (
                  <tr key={e.id} className="table-row-hover">
                    <td className="font-medium text-sm">{e.student?.nickname || e.student?.full_name}</td>
                    <td className="text-gray-400 text-xs">{e.course?.name}</td>
                    <td><span className={`font-semibold text-sm ${rem <= 2 ? 'text-red-600' : 'text-amber-600'}`}>{rem} ครั้ง</span></td>
                    <td><span className={`badge ${rem <= 2 ? 'badge-red' : 'badge-amber'}`}>{rem <= 2 ? 'เร่งด่วน' : 'ใกล้หมด'}</span></td>
                    <td><Link href="/staff/alerts" className="btn-outline btn-sm">แจ้งเตือน</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-gray-800">รีวิวล่าสุด</h3>
            <Link href="/staff/reviews" className="text-xs text-brand-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentReviews ?? []).slice(0, 4).map((r: any) => (
              <div key={r.id} className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium">{r.student?.nickname || r.student?.full_name}</span>
                  <span className="text-amber-400 text-xs">{'★'.repeat(r.rating ?? 0)}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{r.content}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(r.review_date)}</p>
              </div>
            ))}
            {!(recentReviews ?? []).length && (
              <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีรีวิว</p>
            )}
          </div>
        </div>
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
                    {new Date(c.check_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    {!c.check_out_at && ' (ยังอยู่)'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
