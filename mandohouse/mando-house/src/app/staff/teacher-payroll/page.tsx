'use client'

// วางไฟล์นี้ที่: src/app/staff/teacher-payroll/page.tsx
// เข้าที่ /staff/teacher-payroll

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ---------- helpers ----------
const THAI_DAY = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์']

function fmtDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function mondayOf(base: Date) {
  const x = new Date(base)
  const offset = (x.getDay() + 6) % 7 // 0 = Monday
  x.setDate(x.getDate() - offset)
  return x
}
function bangkokDate(iso: string) {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function roundHHMM(iso: string) {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000)
  let h = d.getUTCHours()
  const min = d.getUTCMinutes()
  const m = min < 15 ? 0 : min < 45 ? 30 : 0
  if (min >= 45) h = (h + 1) % 24
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = (h * 60 + m + mins) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
function thaiShort(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const [y, m, day] = dateStr.split('-')
  return { dow: THAI_DAY[d.getDay()], label: `${day}/${m}/${String(Number(y) + 543).slice(2)}` }
}

// ---------- types ----------
interface Teacher {
  id: string
  full_name: string
  rate_onsite: number | null
  rate_online: number | null
  extra_person_fee: number | null
}
interface Session {
  date: string
  timeText: string
  names: string
  mode: 'onsite' | 'online'
  hours: number
  rate: number | null
  heads: number
  extraFee: number
  total: number | null
  note: string
}

export default function TeacherPayrollPage() {
  const supabase = createClient()

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherId, setTeacherId] = useState('')
  const monday = mondayOf(new Date())
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const [start, setStart] = useState(fmtDate(monday))
  const [end, setEnd] = useState(fmtDate(sunday))

  const [sessions, setSessions] = useState<Session[]>([])
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)

  useEffect(() => {
    supabase
      .from('teachers')
      .select('id, full_name, rate_onsite, rate_online, extra_person_fee')
      .order('full_name')
      .then(({ data }) => setTeachers((data ?? []) as Teacher[]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate() {
    const t = teachers.find(x => x.id === teacherId)
    if (!t) { toast.error('เลือกครูก่อน'); return }
    setLoading(true); setRan(true); setTeacher(t)

    // 1) lesson_logs ของครูคนนี้ในช่วงเวลา
    const { data: logs } = await supabase
      .from('lesson_logs')
      .select('enrollment_id, lesson_date, duration_minutes')
      .eq('teacher_name', t.full_name)
      .gte('lesson_date', start)
      .lte('lesson_date', end)

    if (!logs || logs.length === 0) { setSessions([]); setLoading(false); return }

    const enrollIds = Array.from(new Set(logs.map(l => l.enrollment_id).filter(Boolean)))
    // map (enrollment_id + date) -> duration
    const durByKey = new Map<string, number>()
    logs.forEach(l => durByKey.set(`${l.enrollment_id}|${l.lesson_date}`, l.duration_minutes ?? 60))

    // 2) check-ins ของ enrollment เหล่านั้น
    const { data: cins } = await supabase
      .from('checkins')
      .select('id, enrollment_id, student_id, check_in_at, mode, session_start')
      .in('enrollment_id', enrollIds)
      .gte('check_in_at', `${start}T00:00:00+07:00`)
      .lte('check_in_at', `${end}T23:59:59+07:00`)

    const checkins = cins ?? []
    const studentIds = Array.from(new Set(checkins.map(c => c.student_id).filter(Boolean)))

    // 3) students (ชื่อ + head_count) และ enrollments (group_code + ประเภทคอร์ส)
    const [{ data: studs }, { data: enrs }] = await Promise.all([
      supabase.from('students').select('id, nickname, full_name, head_count').in('id', studentIds),
      supabase.from('enrollments').select('id, group_code, course:courses(type)').in('id', enrollIds),
    ])
    const sMap = new Map((studs ?? []).map(s => [s.id, s]))
    const eMap = new Map((enrs ?? []).map(e => [e.id, e]))

    // 4) รวม check-in ที่ตรงกับคาบของครูคนนี้ (enrollment + วันตรงกับ log)
    type Row = {
      cid: string; date: string; time: string; mode: 'onsite' | 'online'
      duration: number; studentId: string; name: string; heads: number
      groupCode: string | null; courseType: string | null
    }
    const rows: Row[] = []
    for (const c of checkins) {
      const date = bangkokDate(c.check_in_at)
      const key = `${c.enrollment_id}|${date}`
      if (!durByKey.has(key)) continue // ไม่ใช่คาบของครูคนนี้ในวันนั้น
      const s = sMap.get(c.student_id) as any
      const e = eMap.get(c.enrollment_id) as any
      rows.push({
        cid: c.id,
        date,
        time: c.session_start ? String(c.session_start).slice(0, 5) : roundHHMM(c.check_in_at),
        mode: (c.mode === 'online' ? 'online' : 'onsite'),
        duration: durByKey.get(key)!,
        studentId: c.student_id,
        name: s?.nickname || s?.full_name || '(ไม่ระบุ)',
        heads: s?.head_count ?? 1,
        groupCode: e?.group_code ?? null,
        courseType: e?.course?.type ?? null,
      })
    }

    // 5) จับกลุ่มเป็นคาบ
    const groups: Record<string, Row[]> = {}
    for (const r of rows) {
      const isGroupCourse = r.courseType === 'group' || r.courseType === 'pair'
      let key: string
      if (r.groupCode) key = `${r.date}|G|${r.groupCode}`
      else if (isGroupCourse) key = `${r.date}|T|${r.time}`
      else key = `${r.date}|S|${r.cid}` // เดี่ยว = แยกคาบเสมอ
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }

    // 6) คำนวณเงินต่อคาบ
    const out: Session[] = []
    for (const key of Object.keys(groups)) {
      const rs = groups[key]
      const first = rs[0]
      const distinct: Record<string, Row> = {}
      rs.forEach(r => { distinct[r.studentId] = r })
      const distinctRows = Object.values(distinct)
      const heads = distinctRows.reduce((sum, r) => sum + (r.heads || 1), 0)
      const hours = (first.duration || 60) / 60
      const rate = first.mode === 'online' ? t.rate_online : t.rate_onsite
      const extraFee = t.extra_person_fee ?? 50
      const names = distinctRows.map(r => r.name).join(' + ')
      const total = rate == null ? null : hours * rate + Math.max(0, heads - 1) * extraFee * hours
      out.push({
        date: first.date,
        timeText: `${first.time}–${addMinutes(first.time, first.duration || 60)}`,
        names, mode: first.mode, hours, rate, heads, extraFee, total,
        note: heads > 1 ? `กลุ่ม ${heads} คน` : 'เดี่ยว',
      })
    }
    out.sort((a, b) => (a.date + a.timeText).localeCompare(b.date + b.timeText))
    setSessions(out)
    setLoading(false)
  }

  const grandTotal = sessions.reduce((s, x) => s + (x.total ?? 0), 0)
  const totalHours = sessions.reduce((s, x) => s + x.hours, 0)
  const unpriced = sessions.filter(x => x.total == null).length

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #payroll-print, #payroll-print * { visibility: visible !important; }
          #payroll-print { position: absolute; left: 0; top: 0; width: 100%; padding: 12px; }
          .no-print { display: none !important; }
        }
      `}} />

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">รายงานค่าสอนครู</h1>

      {/* controls */}
      <div className="no-print flex flex-wrap items-end gap-3 mb-5 p-4 rounded-xl border border-gray-200 dark:border-[#2a3245] bg-white dark:bg-gray-900">
        <div className="flex-1 min-w-[160px]">
          <label className="label">ครู</label>
          <select className="input" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
            <option value="">— เลือกครู —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">ตั้งแต่</label>
          <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">ถึง</label>
          <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <button onClick={generate} disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium">
          {loading ? 'กำลังคำนวณ...' : 'ดูรายงาน'}
        </button>
        {ran && sessions.length > 0 && (
          <button onClick={() => window.print()}
            className="px-4 py-2 rounded-lg border border-brand-500 text-brand-600 dark:text-brand-300 text-sm font-medium hover:bg-brand-50 dark:hover:bg-[#2a3245]">
            พิมพ์ / บันทึก PDF
          </button>
        )}
      </div>

      {unpriced > 0 && (
        <p className="no-print text-sm text-amber-600 dark:text-amber-400 mb-3">
          มี {unpriced} คาบที่ยังไม่มีเรท (ครูยังไม่ได้ตั้งเรทของโหมดนั้น) — จะไม่ถูกรวมยอด
        </p>
      )}

      {/* printable report */}
      {ran && (
        <div id="payroll-print" className="rounded-xl border border-gray-200 dark:border-[#2a3245] bg-white dark:bg-gray-900 p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">ใบบันทึกชั่วโมงการสอน</div>
              <div className="text-xs text-gray-500">แมนโด เฮ้าส์ (Mando House)</div>
            </div>
            <div className="text-sm text-right text-gray-700 dark:text-gray-200">
              <div>ครูผู้สอน : <b>{teacher?.full_name}</b></div>
              <div>รอบ : <b>{thaiShort(start).label} – {thaiShort(end).label}</b></div>
            </div>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">ไม่พบคาบสอนในช่วงนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#232838] text-gray-600 dark:text-gray-300">
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">วัน</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">วันที่</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">เวลา</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-left">ชื่อนักเรียน</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">โหมด</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">ชม.</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">บาท/ชม.</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">คน</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">รวม (บาท)</th>
                    <th className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => {
                    const d = thaiShort(s.date)
                    return (
                      <tr key={i} className={s.heads > 1 ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{d.dow}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{d.label}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{s.timeText}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5">{s.names}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{s.mode}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{s.hours}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{s.rate ?? '—'}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center">{s.heads}</td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center font-semibold">
                          {s.total == null ? '—' : s.total.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-1.5 text-center text-gray-500">{s.note}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-[#232838] font-bold">
                    <td colSpan={8} className="border border-gray-300 dark:border-[#3a4560] px-2 py-2 text-right">
                      รวม {totalHours} ชม. · รวมค่าสอนทั้งช่วง
                    </td>
                    <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-2 text-center">{grandTotal.toLocaleString()}</td>
                    <td className="border border-gray-300 dark:border-[#3a4560] px-2 py-2 text-center">บาท</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
