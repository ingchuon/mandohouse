'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatThaiMoney } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    carry_over: 0,
    total_carry_over: 0,
  })

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    supabase.from('monthly_balance')
      .select('carry_over, total_carry_over')
      .eq('month', currentMonth)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            carry_over: data.carry_over ?? 0,
            total_carry_over: data.total_carry_over ?? 0,
          })
        }
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('monthly_balance')
      .upsert({
        month: currentMonth,
        carry_over: form.carry_over,
        total_carry_over: form.total_carry_over,
      }, { onConflict: 'month' })
    if (error) { toast.error('บันทึกไม่สำเร็จ'); setSaving(false); return }
    toast.success('บันทึกแล้ว ✅')
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">⚙️ ตั้งค่ายอดเงิน</h1>
        <p className="text-sm text-gray-500 mt-0.5">กำหนดยอดยกมาและรายได้สะสม</p>
      </div>

      <div className="card p-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">↩️ ยอดยกมาจากเดือนที่แล้ว (บาท)</label>
            <input
              type="number" min={0} step={0.01} className="input"
              value={form.carry_over}
              onChange={e => setForm({ ...form, carry_over: Number(e.target.value) })}
            />
            <p className="text-xs text-gray-400 mt-1">เงินคงเหลือที่ยกมาจากเดือนก่อน</p>
          </div>
          <div>
            <label className="label">💰 รายได้ทั้งหมดตั้งแต่เปิดกิจการ (บาท)</label>
            <input
              type="number" min={0} step={0.01} className="input"
              value={form.total_carry_over}
              onChange={e => setForm({ ...form, total_carry_over: Number(e.target.value) })}
            />
            <p className="text-xs text-gray-400 mt-1">ใส่ยอดรวมก่อนเริ่มใช้ระบบ เช่น 542,294</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>ยอดยกมา</span>
              <span className="font-medium">{formatThaiMoney(form.carry_over)}</span>
            </div>
            <div className="flex justify-between">
              <span>รายได้ทั้งหมด</span>
              <span className="font-medium">{formatThaiMoney(form.total_carry_over)}</span>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-brand w-full justify-center">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </form>
      </div>
    </div>
  )
}
