// src/app/staff/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatThaiMoney, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const firstOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  const lastOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]

  const [
    { count: totalStudents },
    { count: activeEnrollments },
    { data: receiptsThisMonth },
    { data: receiptsLastMonth },
    { data: allActiveEnrollments },
    { data: recentCheckins },
    { data: recentReviews },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('receipts').select('amount').gte('issued_at', firstOfMonth),
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
  ])

  const revenueThisMonth = receiptsThisMonth?.reduce((s: number, r: any) => s + r.amount, 0) ?? 0
  const revenueLastMonth = receiptsLastMonth?.reduce((s: number, r: any) => s + r.amount, 0) ?? 0
  const revenuePct = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0

  const expiring = (allActiveEnrollments ?? [])
    .filter((e: any) => (e.lessons_total - e.lessons_used) <= 5)
    .sort((a: any, b: any) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">สวัสดีครับ {profile?.full_name} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date(), 'EEEE d MMMM yyyy')}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'นักเรียนทั้งหมด', value: String(totalStudents ?? 0), sub: 'คน (Active)', icon: '👥' },
          { label: 'คอร์สกำลังเรียน', value: String(activeEnrollments ?? 0), sub: 'enrollment', icon: '📚' },
          { label: 'รายได้เดือนนี้', value: formatThaiMoney(revenueThisMonth), sub: revenuePct >= 0 ? `↑ ${revenuePct}% จากเดือนก่อน` : `↓ ${Math.abs(revenuePct)}% จากเดือนก่อน`, subClass: revenuePct >= 0 ? 'text-brand-600' : 'text-red-500', icon: '💰' },
          { label: 'ใกล้หมดคอร์ส', value: String(expiring.length), sub: 'ต้องต่อคอร์ส', subClass: expiring.length > 0 ? 'text-red-500' : 'text-gray-400', icon: '⚠️' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{c.label}</span>
              <span className="text-lg">{c.icon}</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{c.value}</div>
            <div className={`text-xs mt-1 ${(c as any).subClass ?? 'text-gray-400'}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Expiring */}
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

        {/* Recent reviews */}
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

      {/* Today checkins */}
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
              <div key={c.id} className="flex items-center gap-2 bg-brand-50 rounded-lg px-3 py-2">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// Note: Dashboard already pulls receipts; expenses data added in expenses page
