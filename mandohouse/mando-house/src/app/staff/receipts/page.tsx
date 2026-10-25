'use client'
// src/app/staff/receipts/page.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatThaiMoney } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

/* ────────── helpers ────────── */
const THAI_MONTHS_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thaiDateShort(iso: string | null | undefined, sep = ' '): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const day = d.getDate()
  const mon = THAI_MONTHS_ABBR[d.getMonth()]
  const be = String((d.getFullYear() + 543) % 100).padStart(2, '0')
  return `${day}${sep}${mon}${sep}${be}`
}

function money(n: number): string {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function bahtText(input: number): string {
  const amount = Math.round((Number(input) + Number.EPSILON) * 100) / 100
  const neg = amount < 0
  const abs = Math.abs(amount)
  const baht = Math.floor(abs)
  const satang = Math.round((abs - baht) * 100)
  const digit = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const pos = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']
  const readGroup = (n: number): string => {
    let s = ''
    const str = String(n)
    const L = str.length
    for (let i = 0; i < L; i++) {
      const d = +str[i]
      const p = L - i - 1
      if (d === 0) continue
      if (p === 1) s += (d === 1 ? 'สิบ' : d === 2 ? 'ยี่สิบ' : digit[d] + 'สิบ')
      else if (p === 0) s += (d === 1 && L > 1 ? 'เอ็ด' : digit[d])
      else s += digit[d] + pos[p]
    }
    return s
  }
  const readNumber = (n: number): string => {
    if (n === 0) return ''
    let s = ''
    const million = Math.floor(n / 1000000)
    const rest = n % 1000000
    if (million > 0) s += readNumber(million) + 'ล้าน'
    if (rest > 0) s += readGroup(rest)
    return s
  }
  let out = ''
  if (baht > 0) out += readNumber(baht) + 'บาท'
  if (satang > 0) out += readGroup(satang) + 'สตางค์'
  else if (baht > 0) out += 'ถ้วน'
  if (baht === 0 && satang === 0) out = 'ศูนย์บาทถ้วน'
  return (neg ? 'ลบ' : '') + out
}

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Customer = {
  id: string
  name: string
  tax_id: string | null
  branch: string | null
  address: string | null
  phone: string | null
  email: string | null
  use_count: number
  last_used_at: string | null
}

/* ────────── component ────────── */
export default function ReceiptsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [receipts, setReceipts] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [schoolId, setSchoolId] = useState<string>('mando')
  const [showForm, setShowForm] = useState(false)
  const [editReceipt, setEditReceipt] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    enrollment_id: '',
    payment_method: 'transfer',
    notes: '',
    issued_at: new Date().toISOString().split('T')[0],
    amount: 0,
    student_id: '',
    paid_by: 'reserve' as 'reserve' | 'company',
    company_customer_id: '',
    company_customer_name: '',
    company_customer_tax_id: '',
    company_customer_branch: '',
    company_customer_address: '',
    company_customer_phone: '',
    company_customer_email: '',
  })
  const [preview, setPreview] = useState<any>(null)

  const [monthFilter, setMonthFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [accountFilter, setAccountFilter] = useState<'all' | 'reserve' | 'company'>('all')

  const [showSuggest, setShowSuggest] = useState(false)
  const suggestRef = useRef<HTMLDivElement | null>(null)

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    let sid = 'mando'
    let schoolData = null
    let compProf = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('school_id').eq('id', user.id).single()
      if (profile?.school_id) {
        sid = profile.school_id
        const [{ data: sc }, { data: cp }] = await Promise.all([
          supabase.from('schools')
            .select('name, name_th, logo_url, receipt_subtitle, receipt_address, receipt_tel, receipt_receiver')
            .eq('id', sid).single(),
          supabase.from('company_profiles').select('*').eq('school_id', sid).maybeSingle(),
        ])
        schoolData = sc
        compProf = cp
      }
    }
    setSchoolId(sid)
    setSchool(schoolData)
    setCompanyProfile(compProf)

    const [{ data: r }, { data: e }, { data: cus }] = await Promise.all([
      supabase.from('receipts')
        .select('*, student:students(full_name, nickname, parent_name), enrollment:enrollments(*, course:courses(name, price, total_lessons))')
        .order('issued_at', { ascending: false })
        .limit(5000),
      supabase.from('enrollments')
        .select('*, student:students(full_name, nickname), course:courses(name, price, total_lessons)')
        .in('status', ['active', 'completed']),
      supabase.from('company_customers').select('*').order('last_used_at', { ascending: false, nullsFirst: false }),
    ])
    setReceipts(r ?? [])
    setEnrollments(e ?? [])
    setCustomers((cus ?? []) as Customer[])
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggest(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const suggestions = useMemo(() => {
    const q = form.company_customer_name.trim().toLowerCase()
    const list = q
      ? customers.filter(c => c.name.toLowerCase().includes(q) || (c.tax_id ?? '').includes(q))
      : customers
    return list.slice(0, 8)
  }, [form.company_customer_name, customers])

  function pickCustomer(c: Customer) {
    setForm(f => ({
      ...f,
      company_customer_id: c.id,
      company_customer_name: c.name,
      company_customer_tax_id: c.tax_id ?? '',
      company_customer_branch: c.branch ?? '',
      company_customer_address: c.address ?? '',
      company_customer_phone: c.phone ?? '',
      company_customer_email: c.email ?? '',
    }))
    setShowSuggest(false)
    toast.success(`ดึงข้อมูล "${c.name}" แล้ว`)
  }

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

  function blankForm() {
    return {
      enrollment_id: '', payment_method: 'transfer', notes: '',
      issued_at: new Date().toISOString().split('T')[0],
      amount: 0, student_id: '',
      paid_by: 'reserve' as 'reserve' | 'company',
      company_customer_id: '', company_customer_name: '', company_customer_tax_id: '',
      company_customer_branch: '', company_customer_address: '',
      company_customer_phone: '', company_customer_email: '',
    }
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
      paid_by: (r.paid_by === 'company' ? 'company' : 'reserve') as 'reserve' | 'company',
      company_customer_id: r.company_customer_id ?? '',
      company_customer_name: r.company_customer_name ?? '',
      company_customer_tax_id: r.company_customer_tax_id ?? '',
      company_customer_branch: r.company_customer_branch ?? '',
      company_customer_address: r.company_customer_address ?? '',
      company_customer_phone: '',
      company_customer_email: '',
    })
    setShowForm(true)
  }

  // รันเลขใบเสร็จบริษัทย้อนหลังให้ใบที่กำลังแก้ไข (MHR = เงินสดย่อย, MDH = บริษัท)
  async function assignCompanyNumber() {
    if (!editReceipt) return
    const current: string = editReceipt.receipt_number ?? ''
    if (/^(MHR|MDH)-/.test(current)) {
      if (!confirm(`ใบนี้มีเลข ${current} อยู่แล้ว ต้องการออกเลขใหม่ทับไหม?\n(เลขเดิมจะถูกข้ามไป ใช้ซ้ำไม่ได้)`)) return
    }
    const pType = form.paid_by === 'company' ? 'company' : 'reserve'
    const { data: rpcData, error: rpcErr } = await supabase.rpc('next_company_receipt_number', {
      p_school_id: schoolId, p_type: pType,
    })
    if (rpcErr) { toast.error('ออกเลขไม่สำเร็จ: ' + rpcErr.message); return }
    const newNo = rpcData as string
    const { error } = await supabase.from('receipts')
      .update({ receipt_number: newNo, paid_by: form.paid_by }).eq('id', editReceipt.id)
    if (error) { toast.error('บันทึกเลขไม่สำเร็จ: ' + error.message); return }
    setEditReceipt({ ...editReceipt, receipt_number: newNo, paid_by: form.paid_by })
    toast.success(`รันเลขใบเสร็จ ${newNo} แล้ว`)
    loadData()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (editReceipt) {
      const { error } = await supabase.from('receipts').update({
        payment_method: form.payment_method,
        notes: form.notes || null,
        issued_at: form.issued_at,
        amount: form.amount,
        paid_by: form.paid_by,
        company_customer_id: form.company_customer_id || null,
        company_customer_name: form.company_customer_name || null,
        company_customer_tax_id: form.company_customer_tax_id || null,
        company_customer_branch: form.company_customer_branch || null,
        company_customer_address: form.company_customer_address || null,
      }).eq('id', editReceipt.id)
      if (error) { toast.error('แก้ไขไม่สำเร็จ'); return }
      toast.success('แก้ไขแล้ว')
    } else {
      const en = enrollments.find(x => x.id === form.enrollment_id)
      if (!en) { toast.error('กรุณาเลือกนักเรียน'); return }

      setSaving(true)
      try {
        let companyReceiptNumber: string | null = null
        {
          const pType = form.paid_by === 'reserve' ? 'reserve' : 'company'
          const { data: rpcData, error: rpcErr } = await supabase.rpc('next_company_receipt_number', {
            p_school_id: schoolId,
            p_type: pType,
          })
          if (rpcErr) throw rpcErr
          companyReceiptNumber = rpcData as string

          if (form.company_customer_name.trim()) {
            const name = form.company_customer_name.trim()
            const matched = customers.find(c => c.name.trim().toLowerCase() === name.toLowerCase())
            const customerPayload = {
              name,
              tax_id: form.company_customer_tax_id.trim() || null,
              branch: form.company_customer_branch.trim() || null,
              address: form.company_customer_address.trim() || null,
              phone: form.company_customer_phone.trim() || null,
              email: form.company_customer_email.trim() || null,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            let cid = matched?.id ?? (form.company_customer_id || null)
            if (cid) {
              await supabase.from('company_customers')
                .update({ ...customerPayload, use_count: (matched?.use_count ?? 0) + 1 })
                .eq('id', cid)
            } else {
              const { data: newC } = await supabase.from('company_customers')
                .insert({ ...customerPayload, use_count: 1 })
                .select('id').single()
              cid = newC?.id ?? null
            }
          }
        }

        const items = [{
          description: en.course?.name,
          quantity: en.lessons_total ?? en.course?.total_lessons ?? 1,
          unit_price: en.course?.price && (en.lessons_total ?? en.course?.total_lessons)
            ? en.course.price / (en.lessons_total ?? en.course?.total_lessons)
            : (form.amount > 0 ? form.amount : (en.course?.price ?? 0)),
          total: form.amount > 0 ? form.amount : (en.course?.price ?? 0),
          amount: form.amount > 0 ? form.amount : (en.course?.price ?? 0),
        }]

        const insertPayload: any = {
          enrollment_id: en.id,
          student_id: en.student_id,
          issued_at: form.issued_at,
          amount: form.amount > 0 ? form.amount : (en.course?.price ?? 0),
          payment_method: form.payment_method,
          items,
          notes: form.notes || null,
          paid_by: form.paid_by,
        }

        if (companyReceiptNumber) {
          insertPayload.receipt_number = companyReceiptNumber
          if (form.company_customer_name.trim()) {
            insertPayload.company_customer_name = form.company_customer_name.trim()
            insertPayload.company_customer_tax_id = form.company_customer_tax_id.trim() || null
            insertPayload.company_customer_branch = form.company_customer_branch.trim() || null
            insertPayload.company_customer_address = form.company_customer_address.trim() || null
            insertPayload.company_customer_id = form.company_customer_id || null
          }
        }

        const { error } = await supabase.from('receipts').insert(insertPayload)
        if (error) throw error
        toast.success(`ออกใบเสร็จ ${companyReceiptNumber} แล้ว`)
      } catch (err: any) {
        toast.error(err?.message ? `บันทึกไม่สำเร็จ: ${err.message}` : 'บันทึกไม่สำเร็จ')
        setSaving(false)
        return
      }
      setSaving(false)
    }

    setShowForm(false)
    setEditReceipt(null)
    setPreview(null)
    setForm(blankForm())
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบใบเสร็จนี้?')) return
    const { error } = await supabase.from('receipts').delete().eq('id', id)
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบแล้ว')
    loadData()
  }

  /* ── print ── (ทุกใบใช้สไตล์บริษัทเหมือนกันทั้งหมด) */
  function printReceipt(r: any) {
    printCompanyStyleReceipt(r)
  }

  function printCompanyStyleReceipt(r: any) {
    const win = window.open('', '_blank')
    if (!win) { toast.error('เบราว์เซอร์บล็อกป๊อปอัพ'); return }

    const cp = companyProfile

    const sellerLines = [
      cp?.address,
      [cp?.phone ? `โทร. ${cp.phone}` : '', cp?.email].filter(Boolean).join('  ·  '),
      cp?.tax_id ? `เลขประจำตัวผู้เสียภาษี ${cp.tax_id}${cp?.branch ? `  (${cp.branch})` : ''}` : '',
    ].filter(Boolean).map(esc).join('<br>')

    const rawItems: any[] = Array.isArray(r.items) && r.items.length > 0
      ? r.items
      : [{ description: r.enrollment?.course?.name ?? '—', amount: r.amount, quantity: 1, unit_price: r.amount }]

    const MIN_ROWS = 6
    const rows = rawItems.map((it: any, i: number) => `
      <tr class="itemrow">
        <td class="c-no">${i + 1}</td>
        <td class="c-desc">${esc(it.description || '—')}</td>
        <td class="c-qty">${Number(it.quantity ?? 1).toLocaleString('th-TH')}</td>
        <td class="c-price">${money(Number(it.unit_price ?? it.amount ?? 0))}</td>
        <td class="c-amt">${money(Number(it.amount ?? it.total ?? 0))}</td>
      </tr>`).join('')
      + Array.from({ length: Math.max(0, MIN_ROWS - rawItems.length) }).map(() =>
        `<tr class="itemrow"><td class="c-no">&nbsp;</td><td></td><td></td><td></td><td></td></tr>`).join('')

    const total = Number(r.amount || r.total || 0)
    const pm = r.payment_method
    const chk = (on: boolean) => `<span class="box">${on ? '✓' : ''}</span>`

    const custLines = [
      r.company_customer_address
        ? `<div><span class="label">ที่อยู่ / Address :</span> <span class="val">${esc(r.company_customer_address)}</span></div>`
        : `<div><span class="label">ที่อยู่ / Address :</span> <span class="uline"></span></div>`,
      `<div><span class="label">เลขประจำตัวผู้เสียภาษี / Tax ID :</span> <span class="val">${esc(r.company_customer_tax_id || '')}</span>${r.company_customer_branch ? ` <span class="val">(${esc(r.company_customer_branch)})</span>` : ''}</div>`,
      (r.student?.nickname || r.student?.full_name)
        ? `<div><span class="label">นักเรียน / Student :</span> <span class="val">${esc(r.student?.nickname || r.student?.full_name)}</span></div>`
        : '',
    ].filter(Boolean).join('')

    const paidByLabel = r.paid_by === 'reserve' ? 'บัญชีเงินสดย่อย'
      : r.paid_by === 'company' ? 'บัญชีบริษัท' : ''

    const page = (copyTh: string, copyEn: string) => `
<div class="page">
  <div class="copy-tag"><span>${esc(copyTh)} <span class="en">(${esc(copyEn)})</span></span></div>
  <div class="head">
    <div>
      <div class="co-name">${esc(cp?.company_name || school?.name_th || school?.name || 'บริษัทของคุณ')}</div>
      ${cp?.company_name_en ? `<div class="co-name-en">${esc(cp.company_name_en)}</div>` : ''}
      ${cp?.subtitle ? `<div class="co-sub">${esc(cp.subtitle)}</div>` : ''}
      <div class="co-info">${sellerLines}</div>
    </div>
    ${cp?.logo_url || school?.logo_url
      ? `<img class="logo" src="${esc(cp?.logo_url || school?.logo_url)}" alt="logo" />`
      : ''}
  </div>
  <div class="doctitle">
    <span class="t">ใบเสร็จรับเงิน<br><span class="en">Receipt</span></span>
    ${paidByLabel ? `<span class="paid-by-tag">${esc(paidByLabel)}</span>` : ''}
  </div>
  <div class="cust">
    <div style="flex:1">
      <div><span class="label">ชื่อผู้ซื้อ / Customer :</span> <span class="val">${esc(r.company_customer_name || r.student?.full_name || '—')}</span></div>
      ${custLines}
    </div>
    <div class="meta">
      <div><span class="label">เลขที่ / No. :</span> <span class="val">${esc(r.receipt_number ?? '—')}</span></div>
      <div><span class="label">วันที่ / Date :</span> <span class="val">${thaiDateShort(r.issued_at)}</span></div>
    </div>
  </div>
  <table class="items">
    <thead><tr>
      <th class="c-no">ลำดับ<br><span class="en">No.</span></th>
      <th class="c-desc">รายการ<br><span class="en">Description</span></th>
      <th class="c-qty">จำนวน<br><span class="en">Qty</span></th>
      <th class="c-price">ราคา/หน่วย<br><span class="en">Unit Price</span></th>
      <th class="c-amt">จำนวนเงิน<br><span class="en">Amount</span></th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr>
      <td class="t-left">
        <div class="words">ตัวอักษร&nbsp;&nbsp;( ${esc(bahtText(total))} )</div>
        <div class="pay">
          <span class="chk">${chk(pm === 'cash')} เงินสด</span>
          <span class="chk">${chk(pm === 'transfer')} เงินโอน</span>
          <span class="chk">${chk(pm === 'promptpay')} พร้อมเพย์</span>
          <span class="chk">${chk(pm === 'cheque')} เช็ค</span>
        </div>
        ${r.notes ? `<div class="note">หมายเหตุ: ${esc(r.notes)}</div>` : ''}
      </td>
      <td class="t-lbl strong">จำนวนเงินรวมทั้งสิ้น<br><span class="en">Grand Total</span></td>
      <td class="t-num strong">${money(total)}</td>
    </tr>
  </table>
  <div class="sign">
    <div><div class="nm">&nbsp;</div><div class="line"></div>ผู้จ่ายเงิน / Payer</div>
    <div><div class="nm">${esc(cp?.receiver_name || school?.receipt_receiver || '')}</div><div class="line"></div>ผู้รับเงิน / Received by</div>
    <div><div class="nm">${thaiDateShort(r.issued_at, '-')}</div><div class="line"></div>วันที่ / Date</div>
  </div>
  <div class="foot">เอกสารออกโดยระบบ ${esc(cp?.company_name || school?.name_th || '')}</div>
</div>`

    const html = `<!DOCTYPE html><html lang="th"><head>
<meta charset="utf-8"><title>ใบเสร็จ ${esc(r.receipt_number ?? '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{font-family:'Sarabun',sans-serif;color:#000;margin:0;padding:0;font-size:12.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#e9e9e9}
  .page{max-width:760px;margin:16px auto;padding:24px 30px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.15)}
  .copy-tag{text-align:right;margin-bottom:6px}
  .copy-tag span{display:inline-block;border:1px solid #1C3A2A;color:#1C3A2A;font-weight:700;font-size:11px;padding:2px 12px;border-radius:3px}
  .copy-tag .en{font-weight:400;font-size:10px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}
  .head .logo{width:100px;height:86px;object-fit:contain;flex:none}
  .co-name{color:#1C3A2A;font-size:18px;font-weight:700;line-height:1.3}
  .co-name-en{font-size:11.5px;color:#444;font-weight:500}
  .co-sub{font-size:11.5px;color:#000;font-weight:600;margin:2px 0 4px}
  .co-info{line-height:1.75}
  .doctitle{text-align:center;margin:10px 0 12px;display:flex;align-items:center;justify-content:center;gap:12px}
  .doctitle .t{display:inline-block;font-size:16px;font-weight:700;border:1.5px solid #000;padding:5px 26px;border-radius:3px}
  .doctitle .en{font-size:10.5px;font-weight:400;color:#333}
  .paid-by-tag{display:inline-block;font-size:10px;font-weight:700;border:1px solid #7c3aed;color:#7c3aed;padding:2px 10px;border-radius:3px}
  .cust{border-top:1px solid #000;border-bottom:1px solid #000;padding:8px 0;display:flex;justify-content:space-between;gap:22px;line-height:1.95}
  .label{color:#000}.val{color:#1C3A2A;font-weight:600}.uline{display:inline-block;min-width:180px;border-bottom:1px dotted #666}.meta{text-align:right;white-space:nowrap}
  table.items{width:100%;border-collapse:collapse;margin-top:12px}
  table.items th,table.items td{border:1px solid #000;padding:5px 7px}
  table.items thead th{text-align:center;font-weight:700;line-height:1.25;background:#F5F0E8}
  table.items thead .en{font-weight:400;font-size:10px;color:#333}
  .c-no{width:8%;text-align:center}.c-desc{width:44%}.c-qty{width:11%;text-align:center}.c-price{width:17%;text-align:right}.c-amt{width:20%;text-align:right}
  .itemrow td{height:24px}
  table.totals{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
  table.totals td{border:1px solid #000;padding:6px 8px;vertical-align:top}
  table.totals td:first-child{border-left:none}
  .t-left{width:63%}.t-lbl{width:20%;line-height:1.25}.t-lbl .en{font-size:9.5px;color:#333}.t-num{width:17%;text-align:right;white-space:nowrap}.strong{font-weight:700}
  .words{font-weight:600;margin-bottom:6px}.pay{margin-top:2px}.note{font-size:10.5px;color:#555;margin-top:5px}
  .chk{display:inline-flex;align-items:center;gap:5px;margin-right:14px}
  .box{width:14px;height:14px;border:1px solid #000;display:inline-flex;align-items:center;justify-content:center;font-size:11px;line-height:1;color:#1C3A2A}
  .sign{display:flex;justify-content:space-around;margin-top:40px;text-align:center}
  .sign .nm{min-height:18px;margin-bottom:4px;color:#1C3A2A;font-weight:600}
  .sign .line{width:180px;border-bottom:1px dotted #666;height:1px;margin:0 auto 6px}
  .foot{margin-top:12px;font-size:10px;color:#777;text-align:center}
  @media print{
    @page{size:A4;margin:12mm}
    body{background:#fff}
    .page{max-width:none;margin:0;padding:0;box-shadow:none;page-break-after:always;break-after:page}
    .page:last-child{page-break-after:auto;break-after:auto}
  }
</style></head><body>
${page('ต้นฉบับ — สำหรับลูกค้า', 'Original')}
${page('สำเนา — เก็บไว้ที่บริษัท', 'Copy')}
<script>(function(){function go(){try{window.focus();window.print();}catch(e){}}var img=document.querySelector('img');if(img&&!img.complete){img.addEventListener('load',go);img.addEventListener('error',go);setTimeout(go,3000);}else{setTimeout(go,300);}})();</script>
</body></html>`

    win.document.write(html)
    win.document.close()
  }

  const isCompanyMode = true

  // ตัวเลือกเดือน (YYYY-MM) จากใบเสร็จทั้งหมด
  const monthOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of receipts) {
      const k = (r.issued_at ?? '').slice(0, 7)
      if (k) set.add(k)
    }
    return Array.from(set).sort().reverse()
  }, [receipts])

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-')
    const mi = Number(m) - 1
    const be = (Number(y) + 543) % 100
    return `${THAI_MONTHS_ABBR[mi] ?? m} ${be}`
  }

  const filteredReceipts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return receipts.filter(r => {
      if (accountFilter !== 'all' && r.paid_by !== accountFilter) return false
      if (monthFilter !== 'all' && (r.issued_at ?? '').slice(0, 7) !== monthFilter) return false
      if (!q) return true
      const hay = [
        r.receipt_number, r.student?.nickname, r.student?.full_name,
        r.company_customer_name, r.enrollment?.course?.name, r.items?.[0]?.description,
      ].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [receipts, monthFilter, search, accountFilter])

  const filteredTotal = useMemo(
    () => filteredReceipts.reduce((s, r) => s + Number(r.amount || 0), 0),
    [filteredReceipts]
  )

  function downloadExcel() {
    const acctName = (p: string) => p === 'reserve' ? 'เงินสดย่อย' : p === 'company' ? 'บริษัท' : 'ส่วนตัว/อื่นๆ'
    const pmName = (p: string) => (({ transfer: 'โอนเงิน', cash: 'เงินสด', promptpay: 'พร้อมเพย์', cheque: 'เช็ค' } as any)[p] || p || '')
    const rows = filteredReceipts.map(r => ({
      'เลขที่': r.receipt_number ?? '',
      'วันที่': r.issued_at ?? '',
      'นักเรียน': r.student?.nickname || r.student?.full_name || '',
      'คอร์ส/รายการ': r.enrollment?.course?.name ?? r.items?.[0]?.description ?? '',
      'ชื่อบริษัท/ลูกค้า': r.company_customer_name ?? '',
      'เลขผู้เสียภาษี': r.company_customer_tax_id ?? '',
      'จำนวนเงิน': Number(r.amount || 0),
      'ชำระโดย': pmName(r.payment_method),
      'บัญชี': acctName(r.paid_by),
    }))
    rows.push({
      'เลขที่': '', 'วันที่': '', 'นักเรียน': '', 'คอร์ส/รายการ': '',
      'ชื่อบริษัท/ลูกค้า': '', 'เลขผู้เสียภาษี': 'รวม', 'จำนวนเงิน': filteredTotal,
      'ชำระโดย': '', 'บัญชี': '',
    } as any)
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    const label = accountFilter === 'reserve' ? 'เงินสดย่อย' : accountFilter === 'company' ? 'บริษัท' : 'ทั้งหมด'
    XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31))
    const mon = monthFilter === 'all' ? 'ทุกเดือน' : monthFilter
    XLSX.writeFile(wb, `ใบเสร็จ-${label}-${mon}.xlsx`)
  }

  /* ── render ── */
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">ใบเสร็จ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            แสดง {filteredReceipts.length} / {receipts.length} รายการ · รวม {formatThaiMoney(filteredTotal)}
          </p>
        </div>
        <button
          onClick={() => { setEditReceipt(null); setPreview(null); setForm(blankForm()); setShowForm(true) }}
          className="btn-brand"
        >
          + ออกใบเสร็จ
        </button>
      </div>

      {/* ตัวกรอง บัญชี + เดือน + ค้นหา + ดาวน์โหลด */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {([['all', 'ทั้งหมด'], ['reserve', 'บัญชีเงินสดย่อย'], ['company', 'บัญชีบริษัท']] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setAccountFilter(v)}
              className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors ${
                accountFilter === v
                  ? v === 'reserve' ? 'bg-orange-500 text-white border-orange-500'
                    : v === 'company' ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-brand-600 text-white border-brand-600'
                  : 'border-gray-200 dark:border-[#3a4560] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2637]'
              }`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={downloadExcel} disabled={filteredReceipts.length === 0}
            className="btn-outline btn-sm ml-auto disabled:opacity-40">
            ⬇ ดาวน์โหลด Excel
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select className="input sm:w-48" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="all">ทุกเดือน</option>
            {monthOptions.map(ym => (
              <option key={ym} value={ym}>{monthLabel(ym)}</option>
            ))}
          </select>
          <input
            className="input flex-1"
            placeholder="ค้นหา เลขที่ / ชื่อนักเรียน / บริษัท / คอร์ส"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
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
              <th>บัญชี</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map(r => (
              <tr key={r.id} className="table-row-hover">
                <td className="font-mono text-xs text-gray-600 dark:text-gray-300">{r.receipt_number ?? '—'}</td>
                <td className="font-medium text-sm">{r.student?.nickname || r.student?.full_name || '—'}</td>
                <td className="text-sm text-gray-500 dark:text-gray-400">
                  {r.enrollment?.course?.name ?? r.items?.[0]?.description ?? r.subject ?? '—'}
                  {r.company_customer_name && (
                    <div className="text-xs text-purple-600 dark:text-purple-400">{r.company_customer_name}</div>
                  )}
                </td>
                <td className="text-sm">{formatDate(r.issued_at)}</td>
                <td className="font-semibold text-brand-600">{formatThaiMoney(r.amount)}</td>
                <td>
                  <span className="badge badge-blue text-[10px]">
                    {{ transfer: 'โอน', cash: 'เงินสด', promptpay: 'พร้อมเพย์' }[r.payment_method as string] || r.payment_method}
                  </span>
                </td>
                <td>
                  {r.paid_by === 'reserve' && (
                    <span className="badge text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">เงินสดย่อย</span>
                  )}
                  {r.paid_by === 'company' && (
                    <span className="badge text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">บัญชีบริษัท</span>
                  )}
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
            {filteredReceipts.length === 0 && (
              <tr><td colSpan={8} className="text-center text-gray-400 py-8">
                {receipts.length === 0 ? 'ยังไม่มีใบเสร็จ' : 'ไม่พบใบเสร็จตามเงื่อนไข'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#242d3f] rounded-2xl w-full max-w-2xl shadow-xl my-6">
            <div className="p-5 border-b border-gray-100 dark:border-[#3a4560] flex items-center justify-between">
              <h2 className="font-semibold">{editReceipt ? 'แก้ไขใบเสร็จ' : 'ออกใบเสร็จใหม่'}</h2>
              <button onClick={() => { setShowForm(false); setEditReceipt(null); setPreview(null) }} className="text-gray-400">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* บัญชีรับเงิน */}
              <div>
                <label className="label mb-2">บัญชีรับเงิน</label>
                <div className="flex gap-2">
                  {(['reserve', 'company'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paid_by: opt }))}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                        form.paid_by === opt
                          ? opt === 'reserve'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-200 dark:border-[#3a4560] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2637]'
                      }`}
                    >
                      {opt === 'reserve' ? 'บัญชีเงินสดย่อย' : 'บัญชีบริษัท'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {form.paid_by === 'reserve'
                    ? '📋 ออกใบเสร็จเลข MHR-YYYY-XXXX (เงินสดย่อย) · หัวใบเสร็จบริษัท 2 ใบ (ต้นฉบับ/สำเนา)'
                    : '📋 ออกใบเสร็จเลข MDH-YYYY-XXXX (บริษัท) · หัวใบเสร็จบริษัท 2 ใบ (ต้นฉบับ/สำเนา)'}
                </p>
              </div>

              {/* รันเลขบริษัทย้อนหลัง (เฉพาะตอนแก้ไข) */}
              {editReceipt && (
                <div className="rounded-xl border border-gray-200 dark:border-[#3a4560] p-3 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-xs">เลขใบเสร็จ</div>
                    <div className="font-mono font-medium">
                      {editReceipt.receipt_number ?? '—'}
                      {!/^(MHR|MDH)-/.test(editReceipt.receipt_number ?? '') && (
                        <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400">ยังไม่ใช่เลขบริษัท</span>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={assignCompanyNumber}
                    className="btn-outline btn-sm whitespace-nowrap">
                    {/^(MHR|MDH)-/.test(editReceipt.receipt_number ?? '') ? 'ออกเลขใหม่' : `รันเลข ${form.paid_by === 'reserve' ? 'MHR' : 'MDH'}`}
                  </button>
                </div>
              )}

              {/* เลือกนักเรียน */}
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

              {/* จำนวนเงิน */}
              {(editReceipt || form.enrollment_id) && (
                <div>
                  <label className="label">จำนวนเงิน (บาท)</label>
                  <input type="number" min={0} className="input" value={form.amount}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
              )}

              {/* วันที่ + ชำระโดย */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">วันที่ออกใบเสร็จ</label>
                  <input type="date" className="input" value={form.issued_at}
                    onChange={e => setForm({ ...form, issued_at: e.target.value })} />
                </div>
                <div>
                  <label className="label">ชำระโดย</label>
                  <select className="input" value={form.payment_method}
                    onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="transfer">โอนเงิน</option>
                    <option value="cash">เงินสด</option>
                    <option value="promptpay">พร้อมเพย์</option>
                    <option value="cheque">เช็ค</option>
                  </select>
                </div>
              </div>

              {/* ข้อมูลลูกค้าบริษัท */}
              {isCompanyMode && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-900/10 p-4 space-y-3">
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    ข้อมูลลูกค้า / หัวใบเสร็จบริษัท
                  </div>

                  <div ref={suggestRef} className="relative">
                    <label className="label text-xs">ชื่อผู้ซื้อ / บริษัท</label>
                    <input
                      className="input"
                      placeholder="พิมพ์ชื่อหรือเลขผู้เสียภาษีเพื่อค้นหา"
                      value={form.company_customer_name}
                      onChange={e => {
                        setForm(f => ({ ...f, company_customer_name: e.target.value, company_customer_id: '' }))
                        setShowSuggest(true)
                      }}
                      onFocus={() => setShowSuggest(true)}
                    />
                    {showSuggest && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#1e2637] border border-gray-200 dark:border-[#3a4560] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {suggestions.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2a3550] text-sm"
                            onClick={() => pickCustomer(c)}
                          >
                            <div className="font-medium">{c.name}</div>
                            {c.tax_id && <div className="text-xs text-gray-400">{c.tax_id}{c.branch ? ` · ${c.branch}` : ''}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">เลขประจำตัวผู้เสียภาษี</label>
                      <input className="input" placeholder="0-0000-00000-00-0"
                        value={form.company_customer_tax_id}
                        onChange={e => setForm(f => ({ ...f, company_customer_tax_id: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label text-xs">สาขา</label>
                      <input className="input" placeholder="สำนักงานใหญ่"
                        value={form.company_customer_branch}
                        onChange={e => setForm(f => ({ ...f, company_customer_branch: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="label text-xs">ที่อยู่</label>
                    <input className="input" placeholder="ที่อยู่สำหรับออกใบเสร็จ"
                      value={form.company_customer_address}
                      onChange={e => setForm(f => ({ ...f, company_customer_address: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">โทรศัพท์</label>
                      <input className="input" placeholder="(ไม่บังคับ)"
                        value={form.company_customer_phone}
                        onChange={e => setForm(f => ({ ...f, company_customer_phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label text-xs">อีเมล</label>
                      <input className="input" placeholder="(ไม่บังคับ)"
                        value={form.company_customer_email}
                        onChange={e => setForm(f => ({ ...f, company_customer_email: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* หมายเหตุ */}
              <div>
                <label className="label">หมายเหตุ</label>
                <input className="input" placeholder="(ไม่บังคับ)" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              {/* Preview เล็กๆ */}
              {!editReceipt && preview && (
                <div className="rounded-xl border border-gray-100 dark:border-[#3a4560] p-4 bg-gray-50 dark:bg-[#1e2637]">
                  <div className="text-xs text-gray-400 mb-2">ตัวอย่าง</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">นักเรียน</span>
                      <span>{preview.student?.nickname || preview.student?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">คอร์ส</span>
                      <span>{preview.course?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-[#3a4560] pt-2 mt-2">
                      <span>รวม</span>
                      <span className="text-brand-600">{formatThaiMoney(form.amount > 0 ? form.amount : (preview.course?.price ?? 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-brand flex-1 justify-center">
                  {saving ? 'กำลังบันทึก...' : editReceipt ? 'บันทึก' : 'ออกใบเสร็จ'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditReceipt(null); setPreview(null) }}
                  className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
