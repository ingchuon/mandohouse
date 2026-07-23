'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { PLANS, planName, planPerMonth, planMonths, isTrial } from '@/lib/plans'

const C = {
  brown: '#A15C38',
  brownLight: '#f5ede9',
  brownMid: '#e8d5cc',
  dark: '#262220',
  cream: '#F7F1F0',
}

type School = {
  id: string
  name: string
  plan: string
  status: string
  slip_path: string | null
  created_at: string
  expires_at: string | null
}

export default function SubscriptionsPage() {
  const supabase = createClient()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [slipUrl, setSlipUrl] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [renewFor, setRenewFor] = useState<School | null>(null)
  const [filter, setFilter] = useState<'active' | 'expired' | 'all'>('active')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false })
    setSchools((data ?? []).filter(s => s.id !== 'mando'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function viewSlip(slipPath: string) {
    const { data } = await supabase.storage.from('payment-slips').createSignedUrl(slipPath, 60)
    if (data?.signedUrl) setSlipUrl(data.signedUrl)
  }

  // เปิดใช้งาน/ต่ออายุ ตามแพ็กเกจที่ลูกค้าชำระเงินจริง
  async function activateWithPlan(school: School, planId: string) {
    setApproving(school.id)
    // ถ้ายังไม่หมดอายุ ให้ต่อจากวันหมดอายุเดิม (ไม่เสียวันที่จ่ายไปแล้ว)
    const today = new Date()
    const current = school.expires_at ? new Date(school.expires_at) : today
    const base = current > today ? current : today
    const expires = new Date(base)
    expires.setMonth(expires.getMonth() + planMonths(planId))

    const { error } = await supabase.from('schools').update({
      status: 'active',
      plan: planId,
      expires_at: expires.toISOString().split('T')[0],
    }).eq('id', school.id)

    if (error) {
      toast.error('ไม่สำเร็จ: ' + error.message)
    } else {
      toast.success(`เปิดใช้งาน ${school.name} — ${planName(planId)} ถึง ${expires.toISOString().split('T')[0]}`)
      setRenewFor(null)
      load()
    }
    setApproving(null)
  }

  async function suspend(school: School) {
    if (!confirm(`ระงับ "${school.name}" ใช่ไหม?`)) return
    const { error } = await supabase.from('schools').update({ status: 'expired' }).eq('id', school.id)
    if (error) { toast.error('เกิดข้อผิดพลาด'); return }
    toast.success('ระงับแล้ว')
    load()
  }

  function statusBadge(status: string) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      pending:  { label: 'รอตรวจสอบ', bg: '#FEF3C7', color: '#92400E' },
      active:   { label: 'ใช้งานอยู่',  bg: '#D1FAE5', color: '#065F46' },
      expired:  { label: 'หมดอายุ',    bg: '#FEE2E2', color: '#991B1B' },
      rejected: { label: 'ปฏิเสธ',     bg: '#F3F4F6', color: '#6B7280' },
    }
    const s = map[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280' }
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  // สถานะจริง — active ที่เลยวันหมดอายุแล้ว ถือว่าหมดอายุ
  const todayStr = new Date().toISOString().slice(0, 10)
  function effStatus(sc: School): string {
    if (sc.status === 'active' && sc.expires_at && sc.expires_at < todayStr) return 'expired'
    return sc.status
  }

  const visible = schools.filter(sc => filter === 'all' || effStatus(sc) === filter)
  const trialing = schools.filter(sc => effStatus(sc) === 'active' && isTrial(sc.plan)).length
  const active = schools.filter(sc => effStatus(sc) === 'active').length
  const expiredCount = schools.filter(sc => effStatus(sc) === 'expired').length
  // รายได้ต่อเดือน นับเฉพาะลูกค้าที่จ่ายเงินแล้ว (ไม่นับช่วงทดลองใช้)
  const revenue = schools
    .filter(sc => effStatus(sc) === 'active' && !isTrial(sc.plan))
    .reduce((a, sc) => a + planPerMonth(sc.plan), 0)

  return (
    <div className="p-4 md:p-6">

      {/* Modal: เลือกแพ็กเกจที่ลูกค้าชำระเงินมา */}
      {renewFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setRenewFor(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
              เปิดใช้งาน / ต่ออายุ
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{renewFor.name}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
              ปัจจุบัน: {planName(renewFor.plan)}
              {renewFor.expires_at ? ` · หมดอายุ ${renewFor.expires_at}` : ''}
            </div>
            <div style={{ fontSize: 13, color: C.dark, marginBottom: 10 }}>
              เลือกแพ็กเกจที่ลูกค้าชำระเงินมา:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLANS.map(pl => (
                <button key={pl.id} disabled={approving === renewFor.id}
                  onClick={() => activateWithPlan(renewFor, pl.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 8, border: `1.5px solid ${C.brownMid}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{pl.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.brown }}>฿{pl.total.toLocaleString()}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setRenewFor(null)}
              style={{ width: '100%', marginTop: 14, padding: 10, borderRadius: 8, border: 'none', background: '#f3f4f6', color: '#555', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {slipUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSlipUrl(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 16, maxWidth: 400, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>สลิปการโอนเงิน</span>
              <button onClick={() => setSlipUrl(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <img src={slipUrl} alt="slip" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">จัดการ Subscription</h1>
          <p className="text-sm text-gray-500 mt-0.5">อนุมัติสลิปและจัดการลูกค้า TutorCloud</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'ทดลองใช้', value: trialing, color: '#92400E', bg: '#FEF3C7' },
          { label: 'ใช้งานอยู่', value: active, color: '#065F46', bg: '#D1FAE5' },
          { label: 'รายได้/เดือน', value: `฿${revenue.toLocaleString()}`, color: C.brown, bg: C.brownLight },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['active', 'expired', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${filter === f ? C.brown : C.brownMid}`, background: filter === f ? C.brown : '#fff', color: filter === f ? '#fff' : C.dark, fontFamily: 'inherit', transition: 'all .15s' }}>
            {f === 'active' ? `ใช้งานอยู่ (${active})` : f === 'expired' ? `หมดอายุ (${expiredCount})` : 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-12">กำลังโหลด...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-gray-400 py-12">ไม่มีข้อมูล</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-500 border-b">สถาบัน</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-500 border-b">แพ็กเกจ</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-500 border-b">สถานะ</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-500 border-b">วันสมัคร</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-500 border-b">หมดอายุ</th>
                <th className="p-3 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(school => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-[#1e2533] transition-colors">
                  <td className="p-3">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{school.name}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{school.id}</div>
                  </td>
                  <td className="p-3">
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.brown, textTransform: 'capitalize' }}>{planName(school.plan)}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>฿{planPerMonth(school.plan).toLocaleString()}/เดือน</div>
                  </td>
                  <td className="p-3">{statusBadge(effStatus(school))}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(school.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {school.expires_at
                      ? new Date(school.expires_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="p-3">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {school.slip_path && (
                        <button onClick={() => viewSlip(school.slip_path!)}
                          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.brownMid}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: C.dark }}>
                          ดูสลิป
                        </button>
                      )}
                      <button onClick={() => setRenewFor(school)} disabled={approving === school.id}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: 'none', background: C.brown, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: approving === school.id ? 0.6 : 1 }}>
                        {approving === school.id ? '...' : effStatus(school) === 'active' ? 'ต่ออายุ' : 'เปิดใช้งาน'}
                      </button>
                      {effStatus(school) === 'active' && (
                        <button onClick={() => suspend(school)}
                          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#fff', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ระงับ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
