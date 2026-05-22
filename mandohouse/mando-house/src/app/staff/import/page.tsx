'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function ImportPage() {
  const supabase = createClient()
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [previewType, setPreviewType] = useState<'income' | 'expense' | null>(null)
  const [rawRows, setRawRows] = useState<any[]>([])

  function parseDate(val: any): string {
    if (!val) return new Date().toISOString().split('T')[0]
    // Excel date number
    if (typeof val === 'number') {
      const d = new Date((val - 25569) * 86400 * 1000)
      return d.toISOString().split('T')[0]
    }
    // String เช่น "1-May", "2026-05-01"
    if (typeof val === 'string') {
      try {
        const d = new Date(val)
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
      } catch {}
    }
    // Date object
    if (val instanceof Date || (typeof val === 'object' && val !== null)) {
      try {
        const d = new Date(val)
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
      } catch {}
    }
    return new Date().toISOString().split('T')[0]
  }

  function readFile(file: File, type: 'income' | 'expense') {
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { raw: false })
      setRawRows(rows)
      setPreviewType(type)
      setPreview(rows.slice(0, 5))
    }
    reader.readAsBinaryString(file)
  }

  async function importIncome() {
    setImporting(true)
    let success = 0
    let fail = 0

    for (const row of rawRows) {
      const name = String(row['Name'] ?? row['ชื่อ'] ?? '').trim()
      const subject = String(row['Subject'] ?? row['วิชาที่เรียน'] ?? '').trim()
      const amount = Number(String(row['Amount'] ?? row['จำนวนเงิน'] ?? '0').replace(/,/g, ''))
      const bookFee = Number(String(row['ค่าหนังสือ'] ?? '0').replace(/,/g, ''))
      const dateVal = row['Date'] ?? row['วันสมัคร'] ?? ''
      const teacher = String(row['Teacher'] ?? row['ครู'] ?? '').trim()
      const place = String(row['Place'] ?? '').trim()
      const customerType = String(row['Customer type'] ?? '').trim()
      const remark = String(row['Remark'] ?? row['remark'] ?? '').trim()
      const payment = String(row['Payment'] ?? 'transfer').trim().toLowerCase()

      if (!name || amount <= 0) { fail++; continue }

      // หา student_id จากชื่อ
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, nickname')
        .or(`full_name.ilike.%${name}%,nickname.ilike.%${name}%`)
        .limit(1)

      const studentId = students?.[0]?.id ?? null
      const issued_at = parseDate(dateVal)

      const { error } = await supabase.from('receipts').insert({
        student_id: studentId,
        amount: amount,
        book_fee: bookFee || null,
        subject: subject || null,
        teacher_name: teacher || null,
        place: place || null,
        customer_type: customerType || null,
        payment_method: payment === 'cash' ? 'cash' : payment === 'promptpay' ? 'promptpay' : 'transfer',
        notes: remark || null,
        issued_at,
      })

      if (error) { console.error(error); fail++ } else { success++ }
    }

    toast.success(`Import รายรับสำเร็จ ${success} รายการ${fail > 0 ? ` (ข้าม ${fail})` : ''}`)
    setImporting(false)
    setPreview([])
    setRawRows([])
    setPreviewType(null)
  }

  async function importExpense() {
    setImporting(true)
    let success = 0
    let fail = 0

    for (const row of rawRows) {
      const title = String(row['List'] ?? row['รายการ'] ?? '').trim()
      const amount = Number(String(row['price'] ?? row['Price'] ?? row['จำนวนเงิน'] ?? '0').replace(/,/g, ''))
      const teacherAmount = Number(String(row['teacher'] ?? '0').replace(/,/g, ''))
      const ingBeeAom = Number(String(row['Ing+Bee+Aom'] ?? '0').replace(/,/g, ''))
      const dateVal = row['Date'] ?? row['วันที่'] ?? ''
      const expDate = parseDate(dateVal)

      if (title && amount > 0) {
        const { error } = await supabase.from('expenses').insert({
          title,
          amount,
          expense_date: expDate,
          payment_method: 'transfer',
        })
        if (error) { fail++ } else { success++ }
      }

      if (teacherAmount > 0) {
        const { error } = await supabase.from('expenses').insert({
          title: `ค่าสอนครู${title ? ` (${title})` : ''}`,
          amount: teacherAmount,
          expense_date: expDate,
          payment_method: 'transfer',
          teacher_name: 'ครูผู้สอน',
        })
        if (error) { fail++ } else { success++ }
      }

      if (ingBeeAom > 0) {
        const { error } = await supabase.from('expenses').insert({
          title: `ค่าสอน Ing+Bee+Aom${title ? ` (${title})` : ''}`,
          amount: ingBeeAom,
          expense_date: expDate,
          payment_method: 'transfer',
          teacher_name: 'Ing+Bee+Aom',
        })
        if (error) { fail++ } else { success++ }
      }
    }

    toast.success(`Import รายจ่ายสำเร็จ ${success} รายการ${fail > 0 ? ` (ข้าม ${fail})` : ''}`)
    setImporting(false)
    setPreview([])
    setRawRows([])
    setPreviewType(null)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Import ข้อมูล</h1>
        <p className="text-sm text-gray-500 mt-0.5">นำเข้าข้อมูลจากไฟล์ Excel</p>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Import รายรับ */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💰</span>
            <h3 className="font-medium">Import รายรับ</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            ต้องมี column: <strong>Date, Name, Subject, Course, Teacher, Place, Customer type, Amount, ค่าหนังสือ, Payment, Remark</strong>
          </p>
          <label className="btn-brand w-full justify-center cursor-pointer">
            📤 เลือกไฟล์ Excel
            <input type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, 'income'); e.target.value = '' }} />
          </label>
        </div>

        {/* Import รายจ่าย */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📤</span>
            <h3 className="font-medium">Import รายจ่าย</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            ต้องมี column: <strong>Date, List, price, teacher, Ing+Bee+Aom</strong>
          </p>
          <label className="btn-brand w-full justify-center cursor-pointer">
            📤 เลือกไฟล์ Excel
            <input type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, 'expense'); e.target.value = '' }} />
          </label>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="card-header">
            <h3 className="font-medium">ตัวอย่างข้อมูล (5 แถวแรก)</h3>
            <span className="badge badge-blue">{rawRows.length} แถวทั้งหมด</span>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(k => (
                    <th key={k} className="px-2 py-1 text-left bg-gray-50 border border-gray-100 whitespace-nowrap">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-2 py-1 border border-gray-50 truncate max-w-[120px]">{String(v ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={previewType === 'income' ? importIncome : importExpense}
              disabled={importing}
              className="btn-brand"
            >
              {importing ? 'กำลัง Import...' : `✅ ยืนยัน Import ${rawRows.length} แถว`}
            </button>
            <button onClick={() => { setPreview([]); setRawRows([]); setPreviewType(null) }} className="btn-outline">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card p-5">
        <h3 className="font-medium mb-3">💡 คำแนะนำ</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>• ไฟล์ต้องเป็น .xlsx หรือ .xls เท่านั้น</p>
          <p>• ชื่อ column ต้องตรงตามที่กำหนด (case sensitive)</p>
          <p>• ระบบจะจับคู่นักเรียนจากชื่ออัตโนมัติ ถ้าไม่พบจะบันทึกเป็น guest</p>
          <p>• วันที่รองรับรูปแบบ: Excel date, 1-May, 2026-05-01</p>
          <p>• Import ซ้ำได้ แต่ข้อมูลจะเพิ่มขึ้นทุกครั้ง ควรเช็คก่อน</p>
        </div>
      </div>
    </div>
  )
}
