'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function TeachingPage() {
  const supabase = createClient()
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [lessonLogs, setLessonLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({
    enrollment_id: '',
    teacher_id: '',
    lesson_date: new Date().toISOString().split('T')[0],
    topic: '',
    homework: '',
    duration_minutes: 60,
  })
  const [saving, setSaving] = useState(false)

  const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: `${MONTHS_TH[d.getMonth()]} ${d.getFullYear()}` }
  })

  const loadData = useCallback(async () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const firstDay = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(y, m, 0).toISOString().split('T')[0]

    const [{ data: t }, { data: s }, { data: en }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'staff').order('full_name'),
      supabase.from('students').select('id, full_name, nickname').eq('is_active', true).order('nickname'),
      supabase.from('enrollments')
        .select('*, student:students(full_name, nickname), course:courses(name, duration_minutes), teacher:profiles(full_name)')
        .in('status', ['active', 'completed']),
      supabase.from('lesson_logs')
        .select('*, enrollment:enrollments(*, student:students(full_name, nickname), course:courses(name), teacher:profiles(full_name))')
        .gte('lesson_date', firstDay)
        .lte('lesson_date', lastDay)
        .order('lesson_date', { ascending: false }),
    ])

    setTeachers(t ?? [])
    setStudents(s ?? [])
    setEnrollments(en ?? [])
    setLessonLogs(logs ?? [])
    setLoading(false)
  }, [selectedMonth])

  useEffect(() => { loadData() }, [loadData])

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const enrollment = enrollments.find(en => en.id === logForm.enrollment_id)
    if (!enrollment) { toast.error('กรุณาเลือกนักเรียน'); setSaving(false); return }

    const { error } = await supabase.from('lesson_logs').insert({
      enrollment_id: logForm.enrollment_id,
      student_id: enrollment.student_id,
      teacher_id: logForm.teacher_id || null,
      lesson_number: enrollment.lessons_used + 1,
      lesson_date: logForm.lesson_date,
      topic: logForm.topic || null,
      homework: logForm.homework || null,
      duration_minutes: logForm.duration_minutes,
    })

    if (error) { toast.error('บันทึกไม่สำเร็จ'); setSaving(false); return }
    toast.success('บันทึกชั่วโมงสอนแล้ว ✅')
    setShowLogForm(false)
    setLogForm({ enrollment_id: '', teacher_id: '', lesson_date: new Date().toISOString().split('T')[0], topic: '', homework: '', duration_minutes: 60 })
    setSaving(false)
    loadData()
  }

  async function deleteLog(id: string) {
    if (!confirm('ลบบันทึกนี้?')) return
    await supabase.from('lesson_logs').delete().eq('id', id)
    toast.success('ลบแล้ว')
    loadData()
  }

  // Filter logs
  const filteredLogs = lessonLogs.filter(log => {
    if (selectedTeacher === 'all') return true
    return log.enrollment?.teacher?.full_name === teachers.find(t => t.id === selectedTeacher)?.full_name ||
           log.teacher_id === selectedTeacher
  })

  // Teacher stats
  const teacherStats = teachers.map(teacher => {
    const teacherLogs = lessonLogs.filter(log =>
      log.teacher_id === teacher.id ||
      log.enrollment?.teacher_id === teacher.id
    )
    const totalMinutes = teacherLogs.reduce((s, l) => s + (l.duration_minutes ?? 60), 0)
    const teacherEnrollments = enrollments.filter(en => en.teacher_id === teacher.id)
    const activeStudents = new Set(teacherEnrollments.filter(en => en.status === 'active').map(en => en.student_id))
    return {
      ...teacher,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      totalLessons: teacherLogs.length,
      activeStudents: activeStudents.size,
    }
  })

  // Student enrollments
  const studentEnrollments = students.map(student => {
    const studentEnrolls = enrollments.filter(en => en.student_id === student.id)
    const studentLogs = lessonLogs.filter(log => log.student_id === student.id)
    return { ...student, enrollments: studentEnrolls, totalLessons: studentLogs.length }
  }).filter(s => s.enrollments.length > 0)

  function exportExcel() {
    const data = filteredLogs.map(log => ({
      'วันที่': log.lesson_date,
      'นักเรียน': log.enrollment?.student?.nickname || log.enrollment?.student?.full_name || '—',
      'คอร์ส': log.enrollment?.course?.name || '—',
      'ครู': log.enrollment?.teacher?.full_name || '—',
      'เนื้อหา': log.topic || '—',
      'การบ้าน': log.homework || '—',
      'ระยะเวลา (นาที)': log.duration_minutes ?? 60,
      'ชั่วโมง': Math.round((log.duration_minutes ?? 60) / 60 * 10) / 10,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ชั่วโมงสอน')
    XLSX.writeFile(wb, `teaching_${selectedMonth}.xlsx`)
    toast.success('ดาวน์โหลด Excel แล้ว')
  }

  if (loading) return <div className="p-6 text-center text-gray-400 py-20">กำลังโหลด...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">ชั่วโมงการสอน</h1>
          <p className="text-sm text-gray-500 mt-0.5">ติดตามการสอนของครูและนักเรียนแต่ละคน</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-outline">📥 Export Excel</button>
          <button onClick={() => setShowLogForm(true)} className="btn-brand">+ บันทึกชั่วโมงสอน</button>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-5 p-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <select className="input w-auto" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
          <option value="all">ครูทั้งหมด</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>

      {/* Teacher Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {teacherStats.map(t => (
          <div
            key={t.id}
            onClick={() => setSelectedTeacher(selectedTeacher === t.id ? 'all' : t.id)}
            className={`card p-4 cursor-pointer transition hover:shadow-md ${selectedTeacher === t.id ? 'ring-2 ring-brand-400' : ''}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                {t.full_name.slice(0, 2)}
              </div>
              <span className="font-medium text-sm truncate">{t.full_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <div className="text-lg font-bold text-brand-600">{t.totalHours}</div>
                <div className="text-[10px] text-gray-400">ชม.</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">{t.totalLessons}</div>
                <div className="text-[10px] text-gray-400">ครั้ง</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">{t.activeStudents}</div>
                <div className="text-[10px] text-gray-400">นักเรียน</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Log history */}
        <div className="col-span-2 card overflow-hidden">
          <div className="card-header">
            <h3 className="font-medium">ประวัติการสอน</h3>
            <span className="badge badge-blue">{filteredLogs.length} ครั้ง</span>
          </div>
          {filteredLogs.length === 0 ? (
            <p className="text-center text-gray-300 py-10 text-sm">ยังไม่มีบันทึกการสอน</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr><th>วันที่</th><th>นักเรียน</th><th>คอร์ส</th><th>ครู</th><th>เนื้อหา</th><th>เวลา</th><th></th></tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="table-row-hover">
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(log.lesson_date, 'd MMM')}</td>
                    <td className="font-medium text-sm">{log.enrollment?.student?.nickname || log.enrollment?.student?.full_name || '—'}</td>
                    <td className="text-xs text-gray-400">{log.enrollment?.course?.name || '—'}</td>
                    <td className="text-xs text-gray-500">{log.enrollment?.teacher?.full_name || '—'}</td>
                    <td className="text-xs text-gray-600 max-w-[150px] truncate">{log.topic || '—'}</td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{log.duration_minutes ?? 60} นาที</td>
                    <td>
                      <button onClick={() => deleteLog(log.id)} className="btn-outline btn-sm px-2 text-red-400 hover:bg-red-50">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Student enrollments */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-medium">คอร์สของนักเรียน</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {studentEnrollments.map(s => (
              <div key={s.id} className="p-3">
                <div className="font-medium text-sm mb-1">{s.nickname || s.full_name}</div>
                {s.enrollments.map((en: any) => (
                  <div key={en.id} className="text-xs text-gray-500 flex items-center justify-between py-0.5">
                    <span>{en.course?.name}</span>
                    <span className={`badge ${en.status === 'active' ? 'badge-green' : 'badge-gray'} text-[9px]`}>
                      {en.lessons_used}/{en.lessons_total}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {studentEnrollments.length === 0 && (
              <p className="text-center text-gray-300 py-6 text-sm">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Log Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">บันทึกชั่วโมงสอน</h2>
              <button onClick={() => setShowLogForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSaveLog} className="p-5 space-y-3.5">
              <div>
                <label className="label">นักเรียน / คอร์ส *</label>
                <select className="input" required value={logForm.enrollment_id}
                  onChange={e => {
                    const en = enrollments.find(x => x.id === e.target.value)
                    setLogForm({ ...logForm, enrollment_id: e.target.value, teacher_id: en?.teacher_id ?? '', duration_minutes: en?.course?.duration_minutes ?? 60 })
                  }}>
                  <option value="">— เลือกนักเรียน —</option>
                  {enrollments.filter(en => en.status === 'active').map(en => (
                    <option key={en.id} value={en.id}>
                      {en.student?.nickname || en.student?.full_name} – {en.course?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">ครูผู้สอน</label>
                <select className="input" value={logForm.teacher_id}
                  onChange={e => setLogForm({ ...logForm, teacher_id: e.target.value })}>
                  <option value="">— เลือกครู —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">วันที่สอน</label>
                  <input type="date" className="input" value={logForm.lesson_date}
                    onChange={e => setLogForm({ ...logForm, lesson_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">ระยะเวลา (นาที)</label>
                  <input type="number" min={15} step={15} className="input" value={logForm.duration_minutes}
                    onChange={e => setLogForm({ ...logForm, duration_minutes: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">เนื้อหาที่สอน</label>
                <input className="input" placeholder="เช่น พินอิน, บทที่ 3, สระจีน"
                  value={logForm.topic} onChange={e => setLogForm({ ...logForm, topic: e.target.value })} />
              </div>
              <div>
                <label className="label">การบ้าน</label>
                <textarea className="input min-h-[60px] resize-none" placeholder="การบ้านที่ให้..."
                  value={logForm.homework} onChange={e => setLogForm({ ...logForm, homework: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-brand flex-1 justify-center">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowLogForm(false)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
