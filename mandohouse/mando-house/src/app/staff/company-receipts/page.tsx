'use client'
// src/app/staff/company-receipts/page.tsx
// ใบเสร็จรูปแบบบริษัท — จำรายชื่อลูกค้าอัตโนมัติ + รองรับเปิด/ปิด VAT
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

/* ────────────────── helpers ────────────────── */

const THAI_MONTHS_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thaiDateShort(iso: string | null | undefined, sep = ' '): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const be = String((d.getFullYear() + 543) % 100).padStart(2, '0')
  return `${d.getDate()}${sep}${THAI_MONTHS_ABBR[d.getMonth()]}${sep}${be}`
}

function money(n: number): string {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** แปลงจำนวนเงินเป็นตัวอักษรภาษาไทย เช่น 4500 -> "สี่พันห้าร้อยบาทถ้วน" */
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

const PAYMENT_LABEL: Record<string, string> = {
  transfer: 'โอนเงิน', cash: 'เงินสด', promptpay: 'พร้อมเพย์', cheque: 'เช็ค',
}

/* ────────────────── types ────────────────── */

type Item = { description: string; quantity: number; unit_price: number }

type Profile = {
  school_id: string
  company_name: string
  company_name_en: string | null
  subtitle: string | null
  tax_id: string | null
  branch: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  receiver_name: string | null
  receipt_prefix: string
  vat_enabled: boolean
  vat_rate: number
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

const EMPTY_PROFILE: Profile = {
  school_id: '', company_name: '', company_name_en: '', subtitle: '', tax_id: '', branch: 'สำนักงานใหญ่',
  address: '', phone: '', email: '', logo_url: '', receiver_name: '',
  receipt_prefix: 'CR', vat_enabled: false, vat_rate: 7,
}

function blankForm(vatDefault: boolean, vatRate: number) {
  return {
    customer_id: '' as string,
    customer_name: '',
    customer_tax_id: '',
    customer_branch: '',
    customer_address: '',
    customer_phone: '',
    customer_email: '',
    student_id: '',
    issued_at: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    notes: '',
    vat_enabled: vatDefault,
    vat_rate: vatRate,
    price_includes_vat: false,
    items: [{ description: '', quantity: 1, unit_price: 0 }] as Item[],
  }
}

/* ────────────────── page ────────────────── */

export default function CompanyReceiptsPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [profileDraft, setProfileDraft] = useState<Profile>(EMPTY_PROFILE)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState(blankForm(false, 7))

  // autocomplete ชื่อลูกค้า
  const [showSuggest, setShowSuggest] = useState(false)
  const suggestRef = useRef<HTMLDivElement | null>(null)

  /* ---------- load ---------- */
  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    let schoolId = 'mando'
    if (user) {
      const { data: p } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (p?.school_id) schoolId = p.school_id
    }

    const [{ data: prof }, { data: cus }, { data: rec }, { data: stu }] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('school_id', schoolId).maybeSingle(),
      supabase.from('company_customers').select('*').order('last_used_at', { ascending: false, nullsFirst: false }),
      supabase.from('company_receipts').select('*').order('issued_at', { ascending: false }).limit(200),
      supabase.from('students').select('id, full_name, nickname').eq('is_active', true).order('nickname'),
    ])

    let finalProfile: Profile
    if (prof) {
      finalProfile = { ...EMPTY_PROFILE, ...prof }
    } else {
      // ยังไม่เคยตั้งค่า → สร้างแถวเปล่าให้อัตโนมัติ
      const seed = { school_id: schoolId, company_name: '', receipt_prefix: 'CR', vat_enabled: false, vat_rate: 7 }
      await supabase.from('company_profiles').insert(seed)
      finalProfile = { ...EMPTY_PROFILE, school_id: schoolId }
    }

    setProfile(finalProfile)
    setProfileDraft(finalProfile)
    setCustomers((cus ?? []) as Customer[])
    setReceipts(rec ?? [])
    setStudents(stu ?? [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  // ปิด dropdown เมื่อคลิกนอกกรอบ
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggest(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  /* ---------- คำนวณยอด ---------- */
  const totals = useMemo(() => {
    const gross = form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
    const rate = Number(form.vat_rate) || 0
    if (!form.vat_enabled || rate <= 0) {
      return { subtotal: round2(gross), vat: 0, total: round2(gross) }
    }
    if (form.price_includes_vat) {
      const subtotal = round2(gross * 100 / (100 + rate))
      return { subtotal, vat: round2(gross - subtotal), total: round2(gross) }
    }
    const vat = round2(gross * rate / 100)
    return { subtotal: round2(gross), vat, total: round2(gross + vat) }
  }, [form.items, form.vat_enabled, form.vat_rate, form.price_includes_vat])

  /* ---------- autocomplete ---------- */
  const suggestions = useMemo(() => {
    const q = form.customer_name.trim().toLowerCase()
    const list = q
      ? customers.filter(c =>
          c.name.toLowerCase().includes(q) || (c.tax_id ?? '').includes(q))
      : customers
    return list.slice(0, 8)
  }, [form.customer_name, customers])

  function pickCustomer(c: Customer) {
    setForm(f => ({
      ...f,
      customer_id: c.id,
      customer_name: c.name,
      customer_tax_id: c.tax_id ?? '',
      customer_branch: c.branch ?? '',
      customer_address: c.address ?? '',
      customer_phone: c.phone ?? '',
      customer_email: c.email ?? '',
    }))
    setShowSuggest(false)
    toast.success(`ดึงข้อมูล "${c.name}" ที่จำไว้แล้ว`)
  }

  /* ---------- items ---------- */
  function setItem(idx: number, patch: Partial<Item>) {
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }))
  }
  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_price: 0 }] }))
  }
  function removeItem(idx: number) {
    setForm(f => ({ ...f, items: f.items.length <= 1 ? f.items : f.items.filter((_, i) => i !== idx) }))
  }

  /* ---------- open form ---------- */
  function openNew() {
    setEditId(null)
    setForm(blankForm(profile.vat_enabled, profile.vat_rate))
    setShowForm(true)
  }

  function openEdit(r: any) {
    setEditId(r.id)
    const items: Item[] = Array.isArray(r.items) && r.items.length
      ? r.items.map((it: any) => ({
          description: it.description ?? '',
          quantity: Number(it.quantity ?? 1),
          unit_price: Number(it.unit_price ?? 0),
        }))
      : [{ description: '', quantity: 1, unit_price: 0 }]
    setForm({
      customer_id: r.customer_id ?? '',
      customer_name: r.customer_name ?? '',
      customer_tax_id: r.customer_tax_id ?? '',
      customer_branch: r.customer_branch ?? '',
      customer_address: r.customer_address ?? '',
      customer_phone: r.customer_phone ?? '',
      customer_email: r.customer_email ?? '',
      student_id: r.student_id ?? '',
      issued_at: r.issued_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      payment_method: r.payment_method ?? 'transfer',
      notes: r.notes ?? '',
      vat_enabled: !!r.vat_enabled,
      vat_rate: Number(r.vat_rate ?? 7),
      price_includes_vat: false,
      items,
    })
    setShowForm(true)
  }

  /* ---------- save ---------- */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const name = form.customer_name.trim()
    if (!name) { toast.error('กรุณากรอกชื่อผู้ซื้อ/บริษัท'); return }
    const cleanItems = form.items
      .filter(it => it.description.trim() !== '' || Number(it.unit_price) > 0)
      .map(it => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
        amount: round2((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)),
      }))
    if (cleanItems.length === 0) { toast.error('กรุณากรอกรายการอย่างน้อย 1 รายการ'); return }

    setSaving(true)
    try {
      /* --- 1) จำลูกค้า: มีอยู่แล้ว → อัปเดต, ยังไม่มี → สร้างใหม่ --- */
      const matched = customers.find(c => c.name.trim().toLowerCase() === name.toLowerCase())
      const payloadCustomer = {
        name,
        tax_id: form.customer_tax_id.trim() || null,
        branch: form.customer_branch.trim() || null,
        address: form.customer_address.trim() || null,
        phone: form.customer_phone.trim() || null,
        email: form.customer_email.trim() || null,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      let customerId: string | null = matched?.id ?? (form.customer_id || null)
      if (customerId) {
        await supabase.from('company_customers')
          .update({ ...payloadCustomer, use_count: (matched?.use_count ?? 0) + 1 })
          .eq('id', customerId)
      } else {
        const { data: newC, error: cErr } = await supabase.from('company_customers')
          .insert({ ...payloadCustomer, use_count: 1 })
          .select('id').single()
        if (cErr) throw cErr
        customerId = newC?.id ?? null
      }

      /* --- 2) บันทึกใบเสร็จ --- */
      const student = students.find(s => s.id === form.student_id)
      const body: any = {
        customer_id: customerId,
        customer_name: name,
        customer_tax_id: form.customer_tax_id.trim() || null,
        customer_branch: form.customer_branch.trim() || null,
        customer_address: form.customer_address.trim() || null,
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        student_id: form.student_id || null,
        student_name: student ? (student.nickname || student.full_name) : null,
        issued_at: form.issued_at,
        items: cleanItems,
        vat_enabled: form.vat_enabled,
        vat_rate: form.vat_enabled ? Number(form.vat_rate) || 0 : 0,
        subtotal: totals.subtotal,
        vat_amount: totals.vat,
        total: totals.total,
        payment_method: form.payment_method,
        notes: form.notes.trim() || null,
      }

      if (editId) {
        const { error } = await supabase.from('company_receipts').update(body).eq('id', editId)
        if (error) throw error
        toast.success('แก้ไขใบเสร็จแล้ว')
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('company_receipts').insert({ ...body, issued_by: user?.id ?? null })
        if (error) throw error
        toast.success('ออกใบเสร็จบริษัทแล้ว')
      }

      setShowForm(false)
      setEditId(null)
      await loadAll()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message ? `บันทึกไม่สำเร็จ: ${err.message}` : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบใบเสร็จนี้? (เลขที่ใบเสร็จจะไม่ถูกนำกลับมาใช้ซ้ำ)')) return
    const { error } = await supabase.from('company_receipts').delete().eq('id', id)
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบแล้ว')
    loadAll()
  }

  async function deleteCustomer(c: Customer) {
    if (!confirm(`ลบ "${c.name}" ออกจากรายชื่อที่จำไว้?\n(ใบเสร็จเก่ายังอยู่ครบ)`)) return
    const { error } = await supabase.from('company_customers').delete().eq('id', c.id)
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบรายชื่อแล้ว')
    loadAll()
  }

  /* ---------- settings ---------- */
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { school_id, ...rest } = profileDraft
    const { error } = await supabase.from('company_profiles')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('school_id', school_id)
    setSaving(false)
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
    toast.success('บันทึกข้อมูลบริษัทแล้ว')
    setProfile(profileDraft)
    setShowSettings(false)
  }

  /* ---------- print ---------- */
  function printReceipt(r: any) {
    const win = window.open('', '_blank')
    if (!win) { toast.error('เบราว์เซอร์บล็อกป๊อปอัพ — กรุณาอนุญาต'); return }

    const vat = !!r.vat_enabled && Number(r.vat_amount) > 0
    const docTitle = vat ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบเสร็จรับเงิน'
    const docTitleEn = vat ? 'Receipt / Tax Invoice' : 'Receipt'

    const items: any[] = Array.isArray(r.items) ? r.items : []
    const MIN_ROWS = 6
    const rows = items.map((it, i) => `
      <tr class="itemrow">
        <td class="c-no">${i + 1}</td>
        <td class="c-desc">${esc(it.description || '—')}</td>
        <td class="c-qty">${Number(it.quantity ?? 0).toLocaleString('th-TH')}</td>
        <td class="c-price">${money(Number(it.unit_price ?? 0))}</td>
        <td class="c-amt">${money(Number(it.amount ?? (Number(it.quantity ?? 0) * Number(it.unit_price ?? 0))))}</td>
      </tr>`).join('')
      + Array.from({ length: Math.max(0, MIN_ROWS - items.length) }).map(() =>
        `<tr class="itemrow"><td class="c-no">&nbsp;</td><td></td><td></td><td></td><td></td></tr>`).join('')

    const chk = (on: boolean) => `<span class="box">${on ? '✓' : ''}</span>`
    const pm = r.payment_method

    const sellerLines = [
      profile.address,
      [profile.phone ? `โทร. ${profile.phone}` : '', profile.email].filter(Boolean).join('  ·  '),
      profile.tax_id ? `เลขประจำตัวผู้เสียภาษี ${profile.tax_id}${profile.branch ? `  (${profile.branch})` : ''}` : '',
    ].filter(Boolean).map(esc).join('<br>')

    const custLines = [
      r.customer_address
        ? `<div><span class="label">ที่อยู่ / Address :</span> <span class="val">${esc(r.customer_address)}</span></div>`
        : `<div><span class="label">ที่อยู่ / Address :</span> <span class="uline"></span></div>`,
      `<div><span class="label">เลขประจำตัวผู้เสียภาษี / Tax ID :</span> <span class="val">${esc(r.customer_tax_id || '')}</span>${r.customer_branch ? ` <span class="val">(${esc(r.customer_branch)})</span>` : ''}</div>`,
      r.customer_phone || r.customer_email
        ? `<div><span class="label">ติดต่อ / Contact :</span> <span class="val">${esc([r.customer_phone, r.customer_email].filter(Boolean).join('  ·  '))}</span></div>`
        : '',
      r.student_name ? `<div><span class="label">นักเรียน / Student :</span> <span class="val">${esc(r.student_name)}</span></div>` : '',
    ].filter(Boolean).join('')

    const totalRows = vat ? `
      <tr>
        <td class="t-left" rowspan="3">
          <div class="words">ตัวอักษร&nbsp;&nbsp;( ${esc(bahtText(Number(r.total || 0)))} )</div>
          <div class="pay">
            <span class="chk">${chk(pm === 'cash')} เงินสด</span>
            <span class="chk">${chk(pm === 'transfer')} เงินโอน</span>
            <span class="chk">${chk(pm === 'promptpay')} พร้อมเพย์</span>
            <span class="chk">${chk(pm === 'cheque')} เช็ค</span>
          </div>
          ${r.notes ? `<div class="note">หมายเหตุ: ${esc(r.notes)}</div>` : ''}
        </td>
        <td class="t-lbl">รวมเป็นเงิน<br><span class="en">Sub Total</span></td>
        <td class="t-num">${money(r.subtotal)}</td>
      </tr>
      <tr>
        <td class="t-lbl">ภาษีมูลค่าเพิ่ม ${Number(r.vat_rate)}%<br><span class="en">VAT</span></td>
        <td class="t-num">${money(r.vat_amount)}</td>
      </tr>
      <tr>
        <td class="t-lbl strong">จำนวนเงินรวมทั้งสิ้น<br><span class="en">Grand Total</span></td>
        <td class="t-num strong">${money(r.total)}</td>
      </tr>` : `
      <tr>
        <td class="t-left">
          <div class="words">ตัวอักษร&nbsp;&nbsp;( ${esc(bahtText(Number(r.total || 0)))} )</div>
          <div class="pay">
            <span class="chk">${chk(pm === 'cash')} เงินสด</span>
            <span class="chk">${chk(pm === 'transfer')} เงินโอน</span>
            <span class="chk">${chk(pm === 'promptpay')} พร้อมเพย์</span>
            <span class="chk">${chk(pm === 'cheque')} เช็ค</span>
          </div>
          ${r.notes ? `<div class="note">หมายเหตุ: ${esc(r.notes)}</div>` : ''}
        </td>
        <td class="t-lbl strong">จำนวนเงินรวมทั้งสิ้น<br><span class="en">Grand Total</span></td>
        <td class="t-num strong">${money(r.total)}</td>
      </tr>`

    /* ---- 1 หน้า = 1 ฉบับ (ต้นฉบับ / สำเนา) ---- */
    const page = (copyTh: string, copyEn: string) => `
<div class="page">
  <div class="copy-tag"><span>${esc(copyTh)} <span class="en">(${esc(copyEn)})</span></span></div>

  <div class="head">
    <div>
      <div class="co-name">${esc(profile.company_name || 'บริษัทของคุณ')}</div>
      ${profile.company_name_en ? `<div class="co-name-en">${esc(profile.company_name_en)}</div>` : ''}
      ${profile.subtitle ? `<div class="co-sub">${esc(profile.subtitle)}</div>` : ''}
      <div class="co-info">${sellerLines}</div>
    </div>
    ${profile.logo_url ? `<img class="logo" src="${esc(profile.logo_url)}" alt="logo" />` : ''}
  </div>

  <div class="doctitle">
    <span class="t">${esc(docTitle)}<br><span class="en">${esc(docTitleEn)}</span></span>
  </div>

  <div class="cust">
    <div style="flex:1">
      <div><span class="label">ชื่อผู้ซื้อ / Customer :</span> <span class="val">${esc(r.customer_name)}</span></div>
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

  <table class="totals">${totalRows}</table>

  <div class="sign">
    <div><div class="nm">&nbsp;</div><div class="line"></div>ผู้จ่ายเงิน / Payer</div>
    <div><div class="nm">${esc(profile.receiver_name || '')}</div><div class="line"></div>ผู้รับเงิน / Received by</div>
    <div><div class="nm">${thaiDateShort(r.issued_at, '-')}</div><div class="line"></div>วันที่ / Date</div>
  </div>

  <div class="foot">เอกสารออกโดยระบบ ${esc(profile.company_name || '')}</div>
</div>`

    const html = `<!DOCTYPE html><html lang="th"><head>
<meta charset="utf-8"><title>${esc(docTitle)} ${esc(r.receipt_number ?? '')}</title>
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
  .doctitle{text-align:center;margin:10px 0 12px}
  .doctitle .t{display:inline-block;font-size:16px;font-weight:700;border:1.5px solid #000;padding:5px 26px;border-radius:3px}
  .doctitle .en{font-size:10.5px;font-weight:400;color:#333}
  .cust{border-top:1px solid #000;border-bottom:1px solid #000;padding:8px 0;display:flex;justify-content:space-between;gap:22px;line-height:1.95}
  .label{color:#000}
  .val{color:#1C3A2A;font-weight:600}
  .uline{display:inline-block;min-width:180px;border-bottom:1px dotted #666}
  .meta{text-align:right;white-space:nowrap}
  table.items{width:100%;border-collapse:collapse;margin-top:12px}
  table.items th,table.items td{border:1px solid #000;padding:5px 7px}
  table.items thead th{text-align:center;font-weight:700;line-height:1.25;background:#F5F0E8}
  table.items thead .en{font-weight:400;font-size:10px;color:#333}
  .c-no{width:8%;text-align:center}
  .c-desc{width:44%}
  .c-qty{width:11%;text-align:center}
  .c-price{width:17%;text-align:right}
  .c-amt{width:20%;text-align:right}
  .itemrow td{height:24px}
  table.totals{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
  table.totals td{border:1px solid #000;padding:6px 8px;vertical-align:top}
  table.totals td:first-child{border-left:none}
  .t-left{width:63%}
  .t-lbl{width:20%;line-height:1.25}
  .t-lbl .en{font-size:9.5px;color:#333}
  .t-num{width:17%;text-align:right;white-space:nowrap}
  .strong{font-weight:700}
  .words{font-weight:600;margin-bottom:6px}
  .pay{margin-top:2px}
  .note{font-size:10.5px;color:#555;margin-top:5px}
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

<script>
(function(){
  function go(){ try { window.focus(); window.print(); } catch(e){} }
  var img = document.querySelector('img');
  if (img && !img.complete) { img.addEventListener('load', go); img.addEventListener('error', go); setTimeout(go, 3000); }
  else { setTimeout(go, 300); }
})();
</script>
</body></html>`

    win.document.write(html)
    win.document.close()
  }

  /* ---------- filtered list ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return receipts
    return receipts.filter(r =>
      (r.customer_name ?? '').toLowerCase().includes(q) ||
      (r.receipt_number ?? '').toLowerCase().includes(q) ||
      (r.customer_tax_id ?? '').includes(q) ||
      (r.student_name ?? '').toLowerCase().includes(q))
  }, [receipts, search])

  const sumTotal = useMemo(() => filtered.reduce((s, r) => s + Number(r.total || 0), 0), [filtered])

  /* ────────────────── render ────────────────── */
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">ใบเสร็จบริษัท</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-0.5">
            ออกใบเสร็จในนาม {profile.company_name || 'บริษัท (ยังไม่ตั้งค่า)'} · {receipts.length} ใบ
            {profile.vat_enabled ? ' · เปิด VAT' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setProfileDraft(profile); setShowSettings(true) }} className="btn-outline">
            ตั้งค่าบริษัท
          </button>
          <button onClick={openNew} className="btn-brand">+ ออกใบเสร็จ</button>
        </div>
      </div>

      {!profile.company_name && !loading && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ยังไม่ได้กรอกข้อมูลบริษัท — กด <b>ตั้งค่าบริษัท</b> เพื่อใส่ชื่อบริษัท เลขผู้เสียภาษี ที่อยู่ ก่อนออกใบเสร็จใบแรก
        </div>
      )}

      {/* รายชื่อลูกค้าที่จำไว้ */}
      {customers.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="text-sm font-medium mb-2">
            รายชื่อลูกค้าที่ระบบจำไว้ <span className="text-gray-400">({customers.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {customers.slice(0, 20).map(c => (
              <span key={c.id} className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-[#3a4560] px-3 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => { openNew(); setTimeout(() => pickCustomer(c), 0) }}
                  className="hover:text-brand-600 dark:hover:text-brand-300"
                  title="ออกใบเสร็จให้ลูกค้ารายนี้"
                >
                  {c.name}{c.use_count > 0 ? ` · ${c.use_count}` : ''}
                </button>
                <button type="button" onClick={() => deleteCustomer(c)} className="text-gray-300 hover:text-red-500" title="ลบรายชื่อ">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ค้นหา + สรุป */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          className="input max-w-xs"
          placeholder="ค้นหา เลขที่ / ชื่อลูกค้า / เลขผู้เสียภาษี"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="text-sm text-gray-500 dark:text-gray-300">
          รวม <b className="text-brand-600 dark:text-brand-300">{money(sumTotal)} ฿</b> · {filtered.length} ใบ
        </div>
      </div>

      {/* ตาราง */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>ผู้ซื้อ</th>
              <th>เลขผู้เสียภาษี</th>
              <th>นักเรียน</th>
              <th>วันที่</th>
              <th className="text-right">ยอดสุทธิ</th>
              <th>ชำระโดย</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="table-row-hover">
                <td className="font-mono text-xs text-gray-600 dark:text-gray-300">{r.receipt_number ?? '—'}</td>
                <td className="font-medium text-sm">{r.customer_name}</td>
                <td className="text-xs font-mono text-gray-500 dark:text-gray-400">{r.customer_tax_id || '—'}</td>
                <td className="text-sm text-gray-500 dark:text-gray-300">{r.student_name || '—'}</td>
                <td className="text-sm">{formatDate(r.issued_at)}</td>
                <td className="text-right font-semibold text-brand-600 dark:text-brand-300">
                  {money(r.total)} ฿
                  {r.vat_enabled && Number(r.vat_amount) > 0 && (
                    <div className="text-[10px] font-normal text-gray-400">VAT {money(r.vat_amount)}</div>
                  )}
                </td>
                <td><span className="badge badge-blue text-[10px]">{PAYMENT_LABEL[r.payment_method] ?? r.payment_method}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => printReceipt(r)} className="btn-outline btn-sm px-2" title="พิมพ์ (ต้นฉบับ + สำเนา)">🖨</button>
                    <button onClick={() => openEdit(r)} className="btn-outline btn-sm px-2" title="แก้ไข">✎</button>
                    <button onClick={() => handleDelete(r.id)} className="btn-outline btn-sm px-2 text-red-400 hover:bg-red-50" title="ลบ">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-gray-400 py-8">
                {loading ? 'กำลังโหลด...' : 'ยังไม่มีใบเสร็จบริษัท'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ───── modal: ออก/แก้ไขใบเสร็จ ───── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#242d3f] rounded-2xl w-full max-w-3xl shadow-xl my-4">
            <div className="p-5 border-b border-gray-100 dark:border-[#3a4560] flex items-center justify-between">
              <h2 className="font-semibold">{editId ? 'แก้ไขใบเสร็จบริษัท' : 'ออกใบเสร็จบริษัท'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-gray-400">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* ผู้ซื้อ */}
              <div>
                <div className="text-sm font-medium mb-2">ข้อมูลผู้ซื้อ</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="relative md:col-span-2" ref={suggestRef}>
                    <label className="label">ชื่อบริษัท / ผู้ซื้อ *</label>
                    <input
                      className="input"
                      required
                      autoComplete="off"
                      placeholder="พิมพ์ชื่อ — ถ้าเคยออกแล้วระบบจะขึ้นให้เลือก"
                      value={form.customer_name}
                      onFocus={() => setShowSuggest(true)}
                      onChange={e => { setForm(f => ({ ...f, customer_name: e.target.value, customer_id: '' })); setShowSuggest(true) }}
                    />
                    {showSuggest && suggestions.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 dark:border-[#3a4560] bg-white dark:bg-[#2b3448] shadow-lg max-h-60 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-[#3a4560]">
                          รายชื่อที่จำไว้ — กดเพื่อเติมอัตโนมัติ
                        </div>
                        {suggestions.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => pickCustomer(c)}
                            className="w-full text-left px-3 py-2 hover:bg-cream-100 dark:hover:bg-[#3a4560] border-b border-gray-50 dark:border-[#3a4560] last:border-0"
                          >
                            <div className="text-sm font-medium">{c.name}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {[c.tax_id ? `เลขภาษี ${c.tax_id}` : '', c.phone, c.address].filter(Boolean).join(' · ') || 'ไม่มีข้อมูลเพิ่มเติม'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {form.customer_id && (
                      <p className="text-[11px] text-brand-600 dark:text-brand-300 mt-1">✓ ใช้ข้อมูลลูกค้าที่จำไว้ (แก้ไขได้ ระบบจะอัปเดตให้)</p>
                    )}
                  </div>

                  <div>
                    <label className="label">เลขประจำตัวผู้เสียภาษี</label>
                    <input className="input" inputMode="numeric" maxLength={20} placeholder="13 หลัก"
                      value={form.customer_tax_id}
                      onChange={e => setForm(f => ({ ...f, customer_tax_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">สาขา</label>
                    <input className="input" placeholder="สำนักงานใหญ่ / สาขาที่ 00001"
                      value={form.customer_branch}
                      onChange={e => setForm(f => ({ ...f, customer_branch: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">ที่อยู่ออกใบเสร็จ</label>
                    <textarea className="input" rows={2}
                      value={form.customer_address}
                      onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">เบอร์โทร</label>
                    <input className="input" value={form.customer_phone}
                      onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">อีเมล</label>
                    <input className="input" type="email" value={form.customer_email}
                      onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* รายการ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">รายการ</div>
                  <button type="button" onClick={addItem} className="btn-outline btn-sm">+ เพิ่มรายการ</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-6">
                        {i === 0 && <label className="label">รายละเอียด</label>}
                        <input className="input" placeholder="เช่น คอร์สภาษาจีน 20 ครั้ง"
                          value={it.description}
                          onChange={e => setItem(i, { description: e.target.value })} />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        {i === 0 && <label className="label">จำนวน</label>}
                        <input className="input" type="number" min={0} step="any" value={it.quantity}
                          onChange={e => setItem(i, { quantity: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-5 md:col-span-2">
                        {i === 0 && <label className="label">ราคา/หน่วย</label>}
                        <input className="input" type="number" min={0} step="any" value={it.unit_price}
                          onChange={e => setItem(i, { unit_price: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-3 md:col-span-1 text-right text-sm pb-2 font-medium">
                        {money((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
                      </div>
                      <div className="col-span-1 pb-1">
                        <button type="button" onClick={() => removeItem(i)}
                          className="text-gray-300 hover:text-red-500 px-1" title="ลบรายการ">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VAT + สรุปยอด */}
              <div className="rounded-xl border border-gray-100 dark:border-[#3a4560] p-4">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.vat_enabled}
                      onChange={e => setForm(f => ({ ...f, vat_enabled: e.target.checked }))} />
                    คิดภาษีมูลค่าเพิ่ม (VAT)
                  </label>
                  {form.vat_enabled && (
                    <>
                      <label className="flex items-center gap-2 text-sm">
                        อัตรา
                        <input className="input w-20 py-1" type="number" min={0} step="any" value={form.vat_rate}
                          onChange={e => setForm(f => ({ ...f, vat_rate: Number(e.target.value) }))} />
                        %
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.price_includes_vat}
                          onChange={e => setForm(f => ({ ...f, price_includes_vat: e.target.checked }))} />
                        ราคาที่กรอกรวม VAT แล้ว
                      </label>
                    </>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-300">รวมเป็นเงิน</span><span>{money(totals.subtotal)} ฿</span></div>
                  {form.vat_enabled && (
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-300">VAT {form.vat_rate}%</span><span>{money(totals.vat)} ฿</span></div>
                  )}
                  <div className="flex justify-between font-semibold pt-1 border-t border-gray-100 dark:border-[#3a4560]">
                    <span>จำนวนเงินรวมทั้งสิ้น</span>
                    <span className="text-brand-600 dark:text-brand-300">{money(totals.total)} ฿</span>
                  </div>
                  <div className="text-[11px] text-gray-400 text-right">({bahtText(totals.total)})</div>
                </div>
              </div>

              {/* อื่นๆ */}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">นักเรียน (ไม่บังคับ)</label>
                  <select className="input" value={form.student_id}
                    onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}>
                    <option value="">— ไม่ระบุ —</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.nickname || s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">วันที่ออกใบเสร็จ</label>
                  <input className="input" type="date" value={form.issued_at}
                    onChange={e => setForm(f => ({ ...f, issued_at: e.target.value }))} />
                </div>
                <div>
                  <label className="label">ชำระโดย</label>
                  <select className="input" value={form.payment_method}
                    onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                    <option value="transfer">โอนเงิน</option>
                    <option value="cash">เงินสด</option>
                    <option value="promptpay">พร้อมเพย์</option>
                    <option value="cheque">เช็ค</option>
                  </select>
                </div>
                <div>
                  <label className="label">หมายเหตุ</label>
                  <input className="input" placeholder="(ไม่บังคับ)" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-brand flex-1 justify-center disabled:opacity-60">
                  {saving ? 'กำลังบันทึก...' : editId ? 'บันทึกการแก้ไข' : 'ออกใบเสร็จ'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-outline flex-1 justify-center">
                  ยกเลิก
                </button>
              </div>
              {!editId && (
                <p className="text-[11px] text-gray-400 text-center">
                  เลขที่ใบเสร็จออกอัตโนมัติ ({profile.receipt_prefix}-{new Date().getFullYear() + 543}-XXXX)
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ───── modal: ตั้งค่าบริษัท ───── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#242d3f] rounded-2xl w-full max-w-2xl shadow-xl my-4">
            <div className="p-5 border-b border-gray-100 dark:border-[#3a4560] flex items-center justify-between">
              <h2 className="font-semibold">ตั้งค่าข้อมูลบริษัท (หัวใบเสร็จ)</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={saveSettings} className="p-5 grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">ชื่อบริษัท (ไทย) *</label>
                <input className="input" required placeholder="บริษัท แมนโดเฮ้าส์ จำกัด"
                  value={profileDraft.company_name}
                  onChange={e => setProfileDraft(p => ({ ...p, company_name: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">ชื่อบริษัท (อังกฤษ)</label>
                <input className="input" placeholder="MANDO HOUSE CO., LTD."
                  value={profileDraft.company_name_en ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, company_name_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">คำบรรยายใต้ชื่อ (แสดงบนใบเสร็จ)</label>
                <input className="input" placeholder="แมนโด เฮ้าส์ สอนพิเศษภาษาจีน คณิตศาสตร์และภาษาอังกฤษ"
                  value={profileDraft.subtitle ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div>
                <label className="label">เลขประจำตัวผู้เสียภาษี</label>
                <input className="input" maxLength={20} value={profileDraft.tax_id ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, tax_id: e.target.value }))} />
              </div>
              <div>
                <label className="label">สาขา</label>
                <input className="input" value={profileDraft.branch ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, branch: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">ที่อยู่</label>
                <textarea className="input" rows={2} value={profileDraft.address ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="label">เบอร์โทร</label>
                <input className="input" value={profileDraft.phone ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">อีเมล</label>
                <input className="input" type="email" value={profileDraft.email ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">URL โลโก้</label>
                <input className="input" value={profileDraft.logo_url ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, logo_url: e.target.value }))} />
              </div>
              <div>
                <label className="label">ชื่อผู้รับเงิน (พิมพ์บนใบเสร็จ)</label>
                <input className="input" value={profileDraft.receiver_name ?? ''}
                  onChange={e => setProfileDraft(p => ({ ...p, receiver_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">คำนำหน้าเลขที่ใบเสร็จ</label>
                <input className="input" maxLength={10} placeholder="MDH"
                  value={profileDraft.receipt_prefix}
                  onChange={e => setProfileDraft(p => ({ ...p, receipt_prefix: e.target.value.toUpperCase() }))} />
                <p className="text-[11px] text-gray-400 mt-1">
                  ตัวอย่าง: {profileDraft.receipt_prefix || 'CR'}-{new Date().getFullYear() + 543}-0001
                </p>
              </div>
              <div className="md:col-span-2 rounded-xl border border-gray-100 dark:border-[#3a4560] p-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={profileDraft.vat_enabled}
                    onChange={e => setProfileDraft(p => ({ ...p, vat_enabled: e.target.checked }))} />
                  บริษัทจด VAT — ตั้งค่าเริ่มต้นให้เปิด VAT ทุกใบ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  อัตรา
                  <input className="input w-20 py-1" type="number" min={0} step="any"
                    value={profileDraft.vat_rate}
                    onChange={e => setProfileDraft(p => ({ ...p, vat_rate: Number(e.target.value) }))} />
                  %
                </label>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-brand flex-1 justify-center disabled:opacity-60">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowSettings(false)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}
