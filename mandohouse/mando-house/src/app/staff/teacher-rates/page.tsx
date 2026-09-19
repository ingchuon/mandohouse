'use client'

// วางไฟล์นี้ที่: src/app/staff/teacher-rates/page.tsx
// เข้าถึงได้ที่ /staff/teacher-rates (ใช้ layout + auth ของ staff เดิมอัตโนมัติ)

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface TeacherRate {
  id: string
  full_name: string
  subject: string | null
  rate_onsite: number | null
  rate_online: number | null
  extra_person_fee: number | null
}

export default function TeacherRatesPage() {
  const supabase = createClient()
  const [teachers, setTeachers] = useState<TeacherRate[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('teachers')
      .select('id, full_name, subject, rate_onsite, rate_online, extra_person_fee')
      .order('full_name')
    if (error) {
      toast.error('โหลดข้อมูลครูไม่สำเร็จ')
    } else {
      setTeachers((data ?? []) as TeacherRate[])
    }
    setLoading(false)
  }

  function setField(id: string, field: 'rate_onsite' | 'rate_online' | 'extra_person_fee', value: string) {
    const num = value.trim() === '' ? null : Number(value)
    if (num !== null && (isNaN(num) || num < 0)) return
    setTeachers(prev => prev.map(t => (t.id === id ? { ...t, [field]: num } : t)))
  }

  async function save(t: TeacherRate) {
    setSavingId(t.id)
    const { error } = await supabase
      .from('teachers')
      .update({
        rate_onsite: t.rate_onsite,
        rate_online: t.rate_online,
        extra_person_fee: t.extra_person_fee,
      })
      .eq('id', t.id)
    setSavingId(null)
    if (error) toast.error('บันทึกไม่สำเร็จ')
    else toast.success(`บันทึกเรทของ ${t.full_name} แล้ว`)
  }

  const unset = teachers.filter(t => t.rate_onsite == null).length

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">เรทค่าสอนครู</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ตั้งค่าจ้างต่อชั่วโมงของครูแต่ละคน — ใช้คำนวณในรายงานค่าสอน
          {unset > 0 && (
            <span className="ml-2 inline-block text-amber-600 dark:text-amber-400 font-medium">
              (ยังไม่ได้ตั้งเรท {unset} คน)
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a3245] bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a3245] text-gray-500 dark:text-gray-400 text-xs">
                <th className="text-left font-medium px-4 py-3">ครู</th>
                <th className="text-center font-medium px-3 py-3 w-28">ที่ร้าน / ชม.</th>
                <th className="text-center font-medium px-3 py-3 w-28">ออนไลน์ / ชม.</th>
                <th className="text-center font-medium px-3 py-3 w-28">คนเกิน / คน</th>
                <th className="px-3 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr
                  key={t.id}
                  className="border-b border-gray-100 dark:border-[#232838] last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900 dark:text-white">{t.full_name}</div>
                    {t.subject && (
                      <div className="text-xs text-gray-400">{t.subject}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number" min="0" inputMode="numeric"
                      className="input text-center text-sm py-1.5 px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="200"
                      value={t.rate_onsite ?? ''}
                      onChange={e => setField(t.id, 'rate_onsite', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number" min="0" inputMode="numeric"
                      className="input text-center text-sm py-1.5 px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="150"
                      value={t.rate_online ?? ''}
                      onChange={e => setField(t.id, 'rate_online', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number" min="0" inputMode="numeric"
                      className="input text-center text-sm py-1.5 px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="50"
                      value={t.extra_person_fee ?? ''}
                      onChange={e => setField(t.id, 'extra_person_fee', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => save(t)}
                      disabled={savingId === t.id}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-medium transition"
                    >
                      {savingId === t.id ? '...' : 'บันทึก'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        • เว้นว่างได้ถ้ายังไม่กำหนด (รายงานจะข้ามคาบของครูที่ยังไม่ตั้งเรท)<br />
        • “คนเกิน / คน” คือค่าที่บวกเพิ่มต่อ 1 หัวที่เกินคนแรก ต่อชั่วโมง (ค่าเริ่มต้น 50)
      </p>
    </div>
  )
}
