'use client'
// src/app/staff/alerts/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSchool } from '@/lib/school-context'

export default function AlertsPage() {
  const school = useSchool()
  const supabase = createClient()
  const [expiring, setExpiring] = useState<any[]>([])
  const [sentAlerts, setSentAlerts] = useState<any[]>([])
  const [settings, setSettings] = useState({ warn_at_lessons_remaining: 3, notify_via_line: true, notify_parent: true, notify_teacher: true })
  const [sending, setSending] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<{ name: string; message: string } | null>(null)

  async function loadData() {
    const [{ data: enr }, { data: alrt }, { data: cfg }] = await Promise.all([
      supabase.from('enrollments')
        .select('*, student:students(full_name, nickname, parent_name, parent_phone, parent_line_id), course:courses(name)')
        .eq('status', 'active'),
      supabase.from('alerts')
        .select('*, student:students(full_name, nickname)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('alert_settings').select('*').single(),
    ])

    const s = cfg ?? { warn_at_lessons_remaining: 3, notify_via_line: true, notify_parent: true, notify_teacher: true }
    setSettings(s)

    const exp = (enr ?? []).filter(e => {
      const rem = e.lessons_total - e.lessons_used
      return rem <= s.warn_at_lessons_remaining
    }).sort((a, b) => (a.lessons_total - a.lessons_used) - (b.lessons_total - b.lessons_used))

    setExpiring(exp)
    setSentAlerts(alrt ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // เปิดพรีวิวสรุป — ดึงทุกครั้งที่เรียนพร้อมวันที่ ให้ทวนก่อนคัดลอก
  async function openPreview(enrollment: any) {
    setSending(enrollment.id)
    const student = enrollment.student
    const name = student?.nickname || student?.full_name
    const remaining = enrollment.lessons_total - enrollment.lessons_used

    const { data: hist } = await supabase
      .from('lesson_logs').select('lesson_number, lesson_date, topic')
      .eq('enrollment_id', enrollment.id).order('lesson_number', { ascending: true })

    const historyLines = (hist ?? []).map((h: any) => {
      const d = new Date(h.lesson_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
      return `  ครั้งที่ ${h.lesson_number} — ${d}${h.topic ? ` (${h.topic})` : ''}`
    }).join('\n')

    const note = remaining <= 0
      ? 'หมดคอร์สแล้ว กรุณาต่อคอร์สนะคะ 📚'
      : `เหลืออีก ${remaining} ครั้ง แนะนำต่อคอร์สก่อนหมดนะคะ 📚`

    const message = [
      `สรุปการเรียน ${school.name}`,
      `น้อง${name} — ${enrollment.course?.name || ''}`,
      ``,
      historyLines || '  (ยังไม่มีประวัติการเรียน)',
      ``,
      `เรียนไปแล้ว ${enrollment.lessons_used}/${enrollment.lessons_total} ครั้ง`,
      note,
      ``,
      `ขอบคุณที่ไว้วางใจ ${school.name} นะคะ`,
    ].join('\n')

    setPreview({ name, message })
    setSending(null)
  }


  async function saveSettings() {
    await supabase.from('alert_settings').update(settings).eq('id', (await supabase.from('alert_settings').select('id').single()).data?.id)
    toast.success('บันทึกการตั้งค่าแล้ว')
    loadData()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">แจ้งเตือน LINE</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการแจ้งเตือนใกล้หมดคอร์ส</p>
        </div>
        {expiring.length > 0 && (
          <span className="text-sm text-gray-500">{expiring.length} คนใกล้หมดคอร์ส</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Pending alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium">ต้องแจ้งเตือน</h3>
              <span className={`badge ${expiring.length > 0 ? 'badge-red' : 'badge-green'}`}>
                {expiring.length} คน
              </span>
            </div>
            {loading ? (
              <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
            ) : expiring.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">ไม่มีนักเรียนใกล้หมดคอร์ส 🎉</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {expiring.map(e => {
                  const remaining = e.lessons_total - e.lessons_used
                  const name = e.student?.nickname || e.student?.full_name
                  return (
                    <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${remaining <= 2 ? 'bg-red-50' : 'bg-amber-50'}`}>
                        {remaining <= 2 ? '🚨' : '⚠️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">น้อง{name}</div>
                        <div className="text-sm text-gray-500">{e.course?.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          ผู้ปกครอง: {e.student?.parent_name} · {e.student?.parent_phone}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${remaining <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                          {remaining} ครั้ง
                        </div>
                        <div className="text-xs text-gray-400">คงเหลือ</div>
                      </div>
                      <button
                        onClick={() => openPreview(e)}
                        disabled={sending === e.id}
                        className="btn-brand btn-sm flex-shrink-0"
                      >
                        {sending === e.id ? '...' : '📋 สรุปส่งผู้ปกครอง'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* LINE Message Preview */}
          <div className="card p-5">
            <h3 className="font-medium text-gray-800 mb-4">ตัวอย่างข้อความ LINE</h3>
            <div className="bg-[#88B7A3] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#06C755] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-xs text-black/50 font-medium">{school.name}</span>
              </div>
              <div className="bg-white rounded-xl rounded-tl-sm p-3.5 max-w-[280px] shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {`🏫 ${school.name}\n\nสวัสดีครับคุณแม่สมหญิง\n\n⚠️ น้องมิน เหลือ 2 ครั้ง\nจาก 1-on-1 Pro\n\nกรุณาต่อคอร์สก่อนหมด 📚\nสอบถาม: 081-000-1234`}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">* จำลองเท่านั้น ไม่มีการส่งจริง</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Settings */}
          <div className="card p-5">
            <h3 className="font-medium text-gray-800 mb-4">ตั้งค่าการแจ้งเตือน</h3>
            <div className="space-y-4">
              <div>
                <label className="label">แจ้งเตือนเมื่อเหลือ</label>
                <div className="flex items-center gap-2">
                  <select className="input flex-1" value={settings.warn_at_lessons_remaining}
                    onChange={e => setSettings({...settings, warn_at_lessons_remaining: Number(e.target.value)})}>
                    {[2,3,4,5].map(n => <option key={n} value={n}>{n} ครั้ง</option>)}
                  </select>
                  <span className="text-sm text-gray-500 whitespace-nowrap">ครั้งสุดท้าย</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="label">ช่องทาง</label>
                {[
                  { key: 'notify_via_line', label: 'LINE Notify (จำลอง)' },
                  { key: 'notify_parent', label: 'แจ้งเตือนผู้ปกครอง' },
                  { key: 'notify_teacher', label: 'แจ้งเตือนครู' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox"
                      checked={(settings as any)[key]}
                      onChange={e => setSettings({...settings, [key]: e.target.checked})} />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <button onClick={saveSettings} className="btn-brand w-full justify-center">
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>

          {/* Sent history */}
          <div className="card">
            <div className="card-header"><h3 className="font-medium">ประวัติการแจ้งเตือน</h3></div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {sentAlerts.slice(0, 10).map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {a.student?.nickname || a.student?.full_name}
                    </span>
                    <span className="badge badge-green text-[10px]">✓ ส่งแล้ว</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {a.sent_at ? formatDate(a.sent_at) : formatDate(a.created_at)} · {a.sent_via || 'line'}
                  </div>
                </div>
              ))}
              {sentAlerts.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีประวัติ</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* โมดัลพรีวิว — ทวนก่อนคัดลอกส่งผู้ปกครอง */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white dark:bg-[#242d3f] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-xl"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="font-semibold text-gray-900 dark:text-white">สรุปการเรียนน้อง{preview.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">ตรวจดูวันที่เรียนให้ถูกต้องก่อนคัดลอก</div>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 font-sans leading-relaxed bg-gray-50 dark:bg-[#1a2030] rounded-xl p-4 border border-gray-100 dark:border-gray-700">{preview.message}</pre>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <button
                className="btn-brand flex-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(preview.message)
                  toast.success('คัดลอกแล้ว นำไปวางใน LINE ผู้ปกครองได้เลย')
                  setPreview(null)
                }}
              >
                📋 คัดลอกข้อความ
              </button>
              <button className="btn-outline flex-1" onClick={() => setPreview(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
