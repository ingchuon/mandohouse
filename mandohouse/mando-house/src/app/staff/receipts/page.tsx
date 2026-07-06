'use client'
// src/app/staff/receipts/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatThaiMoney } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function ReceiptsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [receipts, setReceipts] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editReceipt, setEditReceipt] = useState<any>(null)
  const [form, setForm] = useState({
    enrollment_id: '', payment_method: 'transfer', notes: '',
    issued_at: new Date().toISOString().split('T')[0],
    amount: 0, student_id: '',
  })
  const [preview, setPreview] = useState<any>(null)

  async function loadData() {
    const [{ data: r }, { data: e }, { data: s }] = await Promise.all([
      supabase.from('receipts')
        .select('*, student:students(full_name, nickname, parent_name), enrollment:enrollments(*, course:courses(name, price, total_lessons))')
        .order('issued_at', { ascending: false })
        .limit(50),
      supabase.from('enrollments')
        .select('*, student:students(full_name, nickname), course:courses(name, price, total_lessons)')
        .in('status', ['active', 'completed']),
      supabase.from('students').select('id, full_name, nickname').eq('is_active', true).order('nickname'),
    ])
    setReceipts(r ?? [])
    setEnrollments(e ?? [])
    setStudents(s ?? [])
  }

  useEffect(() => { loadData() }, [])

  function updatePreview(enrollmentId: string) {
    const en = enrollments.find(e => e.id === enrollmentId)
    if (!en) { setPreview(null); return }
    setPreview(en)
    setForm(f => ({
      ...f,
      enrollment_id: enrollmentId,
      amount: en.course?.price ?? 0,
      student_id: en.student_id,
    }))
  }

  function openEdit(r: any) {
    setEditReceipt(r)
    setForm({
      enrollment_id: r.enrollment_id ?? '',
      payment_method: r.payment_method ?? 'transfer',
      notes: r.notes ?? '',
      issued_at: r.issued_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      amount: r.amount ?? 0,
      student_id: r.student_id ?? '',
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (editReceipt) {
      const { error } = await supabase.from('receipts').update({
        payment_method: form.payment_method,
        notes: form.notes || null,
        issued_at: form.issued_at,
        amount: form.amount,
      }).eq('id', editReceipt.id)
      if (error) { toast.error('แก้ไขไม่สำเร็จ'); return }
      toast.success('แก้ไขแล้ว')
    } else {
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
        amount: form.amount > 0 ? form.amount : (en.course?.price ?? 0),
        payment_method: form.payment_method,
        items,
        notes: form.notes || null,
      })
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
      toast.success('ออกใบเสร็จแล้ว')
    }

    router.refresh()
    await fetch('/api/revalidate', { method: 'POST' })
    setShowForm(false)
    setEditReceipt(null)
    setPreview(null)
    setForm({ enrollment_id: '', payment_method: 'transfer', notes: '', issued_at: new Date().toISOString().split('T')[0], amount: 0, student_id: '' })
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบใบเสร็จนี้?')) return
    const { error } = await supabase.from('receipts').delete().eq('id', id)
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบแล้ว')
    loadData()
  }

  function printReceipt(r: any) {
    const win = window.open('', '_blank')
    if (!win) return

    // ----- เตรียมข้อมูลรายการ (รองรับทั้ง items แบบเก่า {amount,description} และใหม่ {quantity,total}) -----
    const courseName = r.enrollment?.course?.name ?? '—'
    const enrollmentLessons =
      r.enrollment?.lessons_total ?? r.enrollment?.course?.total_lessons ?? null

    const rawItems: any[] =
      Array.isArray(r.items) && r.items.length > 0
        ? r.items
        : courseName !== '—'
          ? [{ description: courseName, total: r.amount }]
          : []

    const rows = rawItems.map((it: any, idx: number) => {
      const lineTotal = Number(it.total ?? it.amount ?? 0)
      // จำนวน: ใช้ของ item ก่อน ถ้าไม่มีและเป็นใบเสร็จคอร์ส (มีจำนวนครั้ง) ให้ดึงจาก enrollment
      const qty: number | null =
        it.quantity != null
          ? Number(it.quantity)
          : (rawItems.length === 1 && enrollmentLessons != null ? Number(enrollmentLessons) : null)
      const isLessons = enrollmentLessons != null && it.quantity == null && rawItems.length === 1
      const qtyText = qty != null ? `${qty}${isLessons ? ' ครั้ง' : ''}` : '—'
      const unitPrice = qty && qty > 0 ? lineTotal / qty : null
      return {
        no: idx + 1,
        description: it.description ?? '—',
        qtyText,
        unitPriceText: unitPrice != null ? formatThaiMoney(unitPrice) : '—',
        totalText: formatThaiMoney(lineTotal),
      }
    })

    const rowsHtml = rows.length > 0
      ? rows.map(row => `
        <tr>
          <td class="c-no">${row.no}</td>
          <td class="c-desc">${row.description}</td>
          <td class="c-qty">${row.qtyText}</td>
          <td class="c-num">${row.unitPriceText}</td>
          <td class="c-num">${row.totalText}</td>
        </tr>`).join('')
      : `<tr><td colspan="5" class="empty">ไม่มีข้อมูลรายการ</td></tr>`

    const payMethod =
      ({ transfer: 'โอนเงิน', cash: 'เงินสด', promptpay: 'พร้อมเพย์' } as Record<string, string>)[r.payment_method]
      || r.payment_method || '—'

    const logoUrl =
      'https://bebfmbijwezoyhoedgtt.supabase.co/storage/v1/object/public/Mando%20house%20logo/Mando%20house%20logo.png'

    const html = `<!DOCTYPE html><html lang="th"><head>
      <meta charset="utf-8"><title>ใบเสร็จ ${r.receipt_number ?? ''}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box}
        body{font-family:'Sarabun','Noto Sans Thai',sans-serif;color:#1a1a1a;margin:0 auto;padding:32px;max-width:660px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .head{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:2px solid #0f766e}
        .head img{height:60px;width:60px;object-fit:contain}
        .brand{flex:1}
        .brand h1{margin:0;font-size:20px;font-weight:700;color:#0f766e}
        .brand p{margin:3px 0 0;font-size:12px;color:#555;line-height:1.6}
        .doc-title{text-align:right}
        .doc-title .th{font-size:18px;font-weight:700}
        .doc-title .en{font-size:11px;color:#999;letter-spacing:2px}
        .meta{display:flex;justify-content:space-between;gap:24px;margin:18px 0 4px;font-size:13px;line-height:1.9}
        .meta .label{color:#999;margin-right:8px}
        table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
        thead th{background:#0f766e;color:#fff;font-weight:600;padding:9px 10px;text-align:left}
        thead th.c-qty,thead th.c-num{text-align:right}
        tbody td{padding:9px 10px;border-bottom:1px solid #eee;vertical-align:top}
        .c-no{width:6%;color:#aaa}
        .c-desc{width:46%}
        .c-qty{width:16%;text-align:right;white-space:nowrap}
        .c-num{width:16%;text-align:right;white-space:nowrap}
        .empty{text-align:center;color:#999;padding:18px}
        .totals{margin-top:14px;display:flex;justify-content:flex-end}
        .totals table{width:auto;min-width:250px;margin:0}
        .totals td{padding:6px 10px;font-size:14px;border:none}
        .totals .grand td{border-top:2px solid #0f766e;font-size:16px;font-weight:700;padding-top:10px}
        .totals .num{text-align:right;white-space:nowrap}
        .pay{margin-top:16px;font-size:13px;color:#444}
        .pay .label{color:#999;margin-right:8px}
        .notes{margin-top:6px;font-size:12px;color:#666}
        .foot{margin-top:36px;display:flex;justify-content:space-between;align-items:flex-end}
        .thanks{font-size:13px;color:#0f766e}
        .sign{text-align:center;font-size:12px;color:#666}
        .sign .line{width:170px;border-top:1px dotted #aaa;margin-bottom:4px}
        @media print{@page{size:A4;margin:16mm}body{padding:0}}
      </style></head><body>

      <div class="head">
        <img src="${logoUrl}" alt="Mando House" />
        <div class="brand">
          <h1>Mando House</h1>
          <p>สถาบันสอนพิเศษภาษาจีน · คณิตศาสตร์ · ภาษาอังกฤษ<br>โทร. 085-093-0111 , 097-172-7677</p>
        </div>
        <div class="doc-title">
          <div class="th">ใบเสร็จรับเงิน</div>
          <div class="en">RECEIPT</div>
        </div>
      </div>

      <div class="meta">
        <div>
          <div><span class="label">เลขที่</span>${r.receipt_number ?? '—'}</div>
          <div><span class="label">วันที่</span>${formatDate(r.issued_at)}</div>
        </div>
        <div style="text-align:right">
          <div><span class="label">นักเรียน</span>${r.student?.nickname || r.student?.full_name || '—'}</div>
          ${r.student?.parent_name ? `<div><span class="label">ผู้ปกครอง</span>${r.student.parent_name}</div>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="c-no">#</th>
            <th class="c-desc">รายการ</th>
            <th class="c-qty">จำนวน</th>
            <th class="c-num">ราคา/หน่วย</th>
            <th class="c-num">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals">
        <table>
          <tr class="grand"><td>รวมทั้งสิ้น</td><td class="num">${formatThaiMoney(r.amount)}</td></tr>
        </table>
      </div>

      <div class="pay"><span class="label">ชำระโดย</span>${payMethod}</div>
      ${r.notes ? `<div class="notes">หมายเหตุ: ${r.notes}</div>` : ''}

      <div class="foot">
        <div class="thanks">ขอบคุณที่ไว้วางใจ Mando House 🙏</div>
        <div class="sign"><div class="line"></div>ผู้รับเงิน</div>
      </div>

      <script>
        (function(){
          function go(){ try { window.focus(); window.print(); } catch (e) {} }
          var img = document.querySelector('img');
          if (img && !img.complete) {
            img.addEventListener('load', go);
            img.addEventListener('error', go);   // โลโก้โหลดไม่ได้ก็ยังพิมพ์ต่อ
            setTimeout(go, 3000);                 // กันเหนียว ถ้าโหลดช้าเกินไป
          } else {
            setTimeout(go, 300);
          }
        })();
      </script>
      </body></html>`

    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">ใบเสร็จ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-0.5">ออกและจัดการใบเสร็จรับเงิน · {receipts.length} รายการ</p>
        </div>
        <button onClick={() => { setEditReceipt(null); setPreview(null); setForm({ enrollment_id: '', payment_method: 'transfer', notes: '', issued_at: new Date().toISOString().split('T')[0], amount: 0, student_id: '' }); setShowForm(true) }} className="btn-brand">
          + ออกใบเสร็จ
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>นักเรียน</th>
              <th>คอร์ส / รายการ</th>
              <th>วันที่</th>
              <th>จำนวนเงิน</th>
              <th>ชำระโดย</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="table-row-hover">
                <td className="font-mono text-xs text-gray-600 dark:text-gray-300">{r.receipt_number ?? '—'}</td>
                <td className="font-medium text-sm">{r.student?.nickname || r.student?.full_name || '—'}</td>
                <td className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300">
                  {r.enrollment?.course?.name ?? r.items?.[0]?.description ?? r.subject ?? '—'}
                </td>
                <td className="text-sm">{formatDate(r.issued_at)}</td>
                <td className="font-semibold text-brand-600">{formatThaiMoney(r.amount)}</td>
                <td>
                  <span className="badge badge-blue text-[10px]">
                    {{ transfer: 'โอน', cash: 'เงินสด', promptpay: 'พร้อมเพย์' }[r.payment_method as string] || r.payment_method}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => printReceipt(r)} className="btn-outline btn-sm px-2">🖨</button>
                    <button onClick={() => openEdit(r)} className="btn-outline btn-sm px-2">✎</button>
                    <button onClick={() => handleDelete(r.id)} className="btn-outline btn-sm px-2 text-red-400 hover:bg-red-50">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-300 py-8">ยังไม่มีใบเสร็จ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#242d3f] rounded-2xl w-full max-w-2xl shadow-xl">
            <div className="p-5 border-b border-gray-100 dark:border-[#3a4560] flex items-center justify-between">
              <h2 className="font-semibold">{editReceipt ? 'แก้ไขใบเสร็จ' : 'ออกใบเสร็จใหม่'}</h2>
              <button onClick={() => { setShowForm(false); setEditReceipt(null); setPreview(null) }} className="text-gray-400 dark:text-gray-300">✕</button>
            </div>
            <div className={editReceipt ? '' : 'grid grid-cols-2 divide-x divide-gray-100'}>
              <form onSubmit={handleSave} className="p-5 space-y-4">
                {!editReceipt && (
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
                )}
                {editReceipt && (
                  <div>
                    <label className="label">จำนวนเงิน (บาท)</label>
                    <input type="number" min={0} className="input" value={form.amount}
                      onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                  </div>
                )}
                {!editReceipt && form.enrollment_id && (
                  <div>
                    <label className="label">จำนวนเงิน (บาท)</label>
                    <input type="number" min={0} className="input" value={form.amount}
                      onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                  </div>
                )}
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
                  <button type="submit" className="btn-brand flex-1 justify-center">
                    {editReceipt ? 'บันทึก' : 'ออกใบเสร็จ'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditReceipt(null); setPreview(null) }} className="btn-outline flex-1 justify-center">ยกเลิก</button>
                </div>
              </form>

              {!editReceipt && (
                <div className="p-5">
                  <p className="text-xs text-gray-400 dark:text-gray-300 mb-4 text-center">ตัวอย่างใบเสร็จ</p>
                  {preview ? (
                    <div className="border border-gray-100 dark:border-[#3a4560] rounded-xl p-5 font-mono text-sm">
                      <div className="text-center mb-2">
                        <div className="text-base font-bold">Mando House</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-300 leading-relaxed">
                          สถาบันสอนพิเศษภาษาจีน คณิตศาสตร์ ภาษาอังกฤษ<br/>
                          085-0930111 ， 097-1727677
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-300 mt-1">ใบเสร็จรับเงิน</div>
                      </div>
                      <div className="space-y-1.5 text-xs border-t border-gray-100 dark:border-[#3a4560] pt-3">
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-300">นักเรียน</span><span>{preview.student?.nickname || preview.student?.full_name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-300">คอร์ส</span><span>{preview.course?.name ?? '—'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 dark:text-gray-300">จำนวน</span><span>{preview.lessons_total} ครั้ง</span></div>
                      </div>
                      <div className="flex justify-between font-bold text-sm mt-3 pt-3 border-t border-gray-200 dark:border-[#3a4560]">
                        <span>รวม</span>
                        <span className="text-brand-600">{formatThaiMoney(form.amount > 0 ? form.amount : (preview.course?.price ?? 0))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 dark:border-[#3a4560] rounded-xl h-40 flex items-center justify-center text-gray-300 text-sm">
                      เลือกนักเรียนเพื่อดูตัวอย่าง
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
