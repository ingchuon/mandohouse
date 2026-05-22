'use client'
// src/app/staff/receipts/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatThaiMoney } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ReceiptsPage() {
  const supabase = createClient()
  const [receipts, setReceipts] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    enrollment_id: '', payment_method: 'transfer', notes: '',
    issued_at: new Date().toISOString().split('T')[0],
  })
  const [preview, setPreview] = useState<any>(null)

  async function loadData() {
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from('receipts')
        .select('*, student:students(full_name, nickname, parent_name), enrollment:enrollments(*, course:courses(name, price, total_lessons))')
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('enrollments')
        .select('*, student:students(full_name, nickname), course:courses(name, price, total_lessons)')
        .eq('status', 'active'),
    ])
    setReceipts(r ?? [])
    setEnrollments(e ?? [])
  }

  useEffect(() => { loadData() }, [])

  function updatePreview(enrollmentId: string) {
    const en = enrollments.find(e => e.id === enrollmentId)
    if (!en) { setPreview(null); return }
    setPreview(en)
    setForm(f => ({ ...f, enrollment_id: enrollmentId }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const en = enrollments.find(x => x.id === form.enrollment_id)
    if (!en) { toast.error('กรุณาเลือกนักเรียน'); return }

    const items = [{
      description: en.course?.name,
      quantity: en.lessons_total,
      unit_price: en.course?.price && en.lessons_total ? en.course.price / en.lessons_total : 0,
      total: en.course?.price ?? 0,
    }]

    const { error } = await supabase.from('receipts').insert({
      enrollment_id: en.id,
      student_id: en.student_id,
      issued_at: form.issued_at,
      amount: en.course?.price ?? 0,
      payment_method: form.payment_method,
      items,
      notes: form.notes,
    })

    if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
    toast.success('ออกใบเสร็จแล้ว')
    setShowForm(false)
    setPreview(null)
    loadData()
  }

  function printReceipt(r: any) {
    const win = window.open('', '_blank')
    if (!win) return

    // fallback ถ้าไม่มี items ให้ดึงจาก enrollment
    const courseName = r.enrollment?.course?.name ?? '—'
    const lessons = r.enrollment?.lessons_total ?? 0
    const items = (r.items && r.items.length > 0)
      ? r.items
      : courseName !== '—'
        ? [{ description: courseName, quantity: lessons, total: r.amount }]
        : []

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>ใบเสร็จ ${r.receipt_number}</title>
      <style>
        body{font-family:'Noto Sans Thai',sans-serif;padding:40px;max-width:480px;margin:0 auto;color:#111}
        .logo{font-size:24px;font-weight:700;text-align:center;margin-bottom:4px}
        .sub{color:#666;font-size:14px;text-align:center;margin-bottom:20px}
        .divider{border:0;border-top:1px solid #eee;margin:16px 0}
        .row{display:flex;justify-content:space-between;font-size:14px;padding:6px 0}
        .total{font-size:16px;font-weight:700;border-top:2px solid #111;margin-top:8px;padding-top:12px}
        .footer{text-align:center;font-size:13px;color:#666;margin-top:24px}
        @media print{@page{margin:20mm}}
      </style></head><body>
      <div class="logo">曼 Mando House</div>
      <div class="sub">ใบเสร็จรับเงิน · Receipt</div>
      <hr class="divider">
      <div class="row"><span>เลขที่</span><span>${r.receipt_number}</span></div>
      <div class="row"><span>วันที่</span><span>${formatDate(r.issued_at)}</span></div>
      <div class="row"><span>นักเรียน</span><span>${r.student?.nickname || r.student?.full_name}</span></div>
      <div class="row"><span>ผู้ปกครอง</span><span>${r.student?.parent_name || '—'}</span></div>
      <hr class="divider">
      ${items.length > 0 ? items.map((it: any) => `
        <div class="row"><span>${it.description ?? '—'}</span><span></span></div>
        <div class="row" style="color:#666;font-size:13px">
          <span>จำนวน ${it.quantity ?? 0} ครั้ง</span>
          <span>${formatThaiMoney(it.total ?? 0)}</span>
        </div>
      `).join('') : `<div class="row"><span style="color:#999">ไม่มีข้อมูลคอร์ส</span></div>`}
      <div class="row total"><span>รวมทั้งสิ้น</span><span>${formatThaiMoney(r.amount)}</span></div>
      <div class="row"><span>ชำระโดย</span><span>${{ transfer: 'โอนเงิน', cash: 'เงินสด', promptpay: 'พร้อมเพย์' }[r.payment_method as string] || r.payment_method}</span></div>
      <div class="footer">ขอบคุณที่ไว้วางใจ Mando House 🙏</div>
      </body></html>`
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">ใบเสร็จ</h1>
          <p className="text-sm text-gray-500 mt-0.5">ออกและจัดการใบเสร็จรับเงิน</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-brand">+ ออกใบเสร็จ</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr><th>เลขที่</th><th>นักเรียน</th><th>คอร์ส</th><th>วันที่</th><th>จำนวนเงิน</th><th>ชำระโดย</th><th></th></tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="table-row-hover">
                <td className="font-mono text-xs text-gray-600">{r.receipt_number}</td>
                <td className="font-medium text-sm">{r.student?.nickname || r.student?.full_name}</td>
                <td className="text-sm text-gray-500">
                  {r.enrollment?.course?.name ?? (r.items?.[0]?.description ?? '—')}
                </td>
                <td className="text-sm">{formatDate(r.issued_at)}</td>
                <td className="font-semibold text-brand-600">{formatThaiMoney(r.amount)}</td>
                <td>
                  <span className="badge badge-blue text-[10px]">
                    {{ transfer: 'โอน', cash: 'เงินสด', promptpay: 'พร้อมเพย์' }[r.payment_method as string] || r.payment_method}
                  </span>
                </td>
                <td>
                  <button onClick={() => printReceipt(r)} className="btn-outline btn-sm">
                    🖨 พิมพ์
                  </button>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-8">ยังไม่มีใบเสร็จ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Receipt Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">ออกใบเสร็จใหม่</h2>
              <button onClick={() => { setShowForm(false); setPreview(null) }} className="text-gray-400">✕</button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="label">นักเรียน *</label>
                  <select className="input" required value={form.enrollment_id}
                    onChange={e => updatePreview(e.target.value)}>
                    <option value="">— เลือกนักเรียน —</option>
                    {enrollments.map(en => (
                      <option key={en.id} value={en.id}>
                        {en.student?.nickname || en.student?.full_name} – {en.course?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">วันที่ออกใบเสร็จ</label>
                  <input type="date" className="input" value={form.issued_at}
                    onChange={e => setForm({...form, issued_at: e.target.value})} />
                </div>
                <div>
                  <label className="label">ชำระโดย</label>
                  <select className="input" value={form.payment_method}
                    onChange={e => setForm({...form, payment_method: e.target.value})}>
                    <option value="transfer">โอนเงิน</option>
                    <option value="cash">เงินสด</option>
                    <option value="promptpay">พร้อมเพย์</option>
                  </select>
                </div>
                <div>
                  <label className="label">หมายเหตุ</label>
                  <input className="input" placeholder="(ไม่บังคับ)" value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="btn-brand flex-1 justify-center">ออกใบเสร็จ</button>
                  <button type="button" onClick={() => { setShowForm(false); setPreview(null) }} className="btn-outline flex-1 justify-center">ยกเลิก</button>
                </div>
              </form>

              {/* Preview */}
              <div className="p-5">
                <p className="text-xs text-gray-400 mb-4 text-center">ตัวอย่างใบเสร็จ</p>
                {preview ? (
                  <div className="border border-gray-100 rounded-xl p-5 font-mono text-sm">
                    <div className="text-center mb-4">
                      <div className="text-lg font-bold">曼 Mando House</div>
                      <div className="text-xs text-gray-500">ใบเสร็จรับเงิน</div>
                      <div className="text-xs text-gray-400 mt-1">เลขที่: MH-{new Date().getFullYear()}-XXXX</div>
                    </div>
                    <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
                      <div className="flex justify-between"><span className="text-gray-500">นักเรียน</span><span>{preview.student?.nickname || preview.student?.full_name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">คอร์ส</span><span>{preview.course?.name ?? '—'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">จำนวน</span><span>{preview.lessons_total} ครั้ง</span></div>
                    </div>
                    <div className="flex justify-between font-bold text-sm mt-3 pt-3 border-t border-gray-200">
                      <span>รวม</span>
                      <span className="text-brand-600">{formatThaiMoney(preview.course?.price ?? 0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-xl h-40 flex items-center justify-center text-gray-300 text-sm">
                    เลือกนักเรียนเพื่อดูตัวอย่าง
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
