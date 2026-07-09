'use client'
// src/app/staff/schedule/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์']
const DAYS_SHORT = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']
const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00',
]

type Room = { id: string; name: string; color: string; capacity: number; is_active: boolean }
type Schedule = {
  id: string; course_id: string; room_id: string; teacher_id: string
  day_of_week: number; start_time: string; end_time: string
  is_active: boolean; notes?: string
  course?: { name: string }
  teacher?: { full_name: string }
  room?: Room
  schedule_students?: { student?: { nickname: string; full_name: string } }[]
}

export default function SchedulePage() {
  const supabase = createClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
  const [showStudentModal, setShowStudentModal] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    course_id: '', room_id: '', teacher_id: '',
    day_of_week: 1, start_time: '14:00', end_time: '15:00', notes: '',
  })

  const loadData = useCallback(async () => {
    const [
      { data: r }, { data: s }, { data: st },
      { data: c }, { data: t }, { data: en },
    ] = await Promise.all([
      supabase.from('rooms').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('class_schedules').select(`
        *, course:courses(name), teacher:profiles(full_name), room:rooms(name,color),
        schedule_students(student:students(nickname,full_name))
      `).eq('is_active', true).order('start_time'),
      supabase.from('students').select('id, full_name, nickname').eq('is_active', true).order('nickname'),
      supabase.from('courses').select('id, name').eq('is_active', true),
      supabase.from('profiles').select('id, full_name').eq('role', 'staff'),
      supabase.from('enrollments').select('id, student_id, course_id').eq('status', 'active'),
    ])
    setRooms(r ?? [])
    setSchedules(s ?? [])
    setStudents(st ?? [])
    setCourses(c ?? [])
    setTeachers(t ?? [])
    setEnrollments(en ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function hasConflict(roomId: string, day: number, start: string, end: string, excludeId?: string) {
    return schedules.some(s =>
      s.id !== excludeId &&
      s.room_id === roomId &&
      s.day_of_week === day &&
      s.start_time < end &&
      s.end_time > start
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (form.start_time >= form.end_time) {
      toast.error('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด'); setSaving(false); return
    }
    if (hasConflict(form.room_id, form.day_of_week, form.start_time, form.end_time, editSchedule?.id)) {
      toast.error('ห้องนี้ถูกจองในช่วงเวลานั้นแล้ว'); setSaving(false); return
    }
    const payload = {
      course_id: form.course_id || null,
      room_id: form.room_id,
      teacher_id: form.teacher_id || null,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes || null,
    }
    let error
    if (editSchedule) {
      ;({ error } = await supabase.from('class_schedules').update(payload).eq('id', editSchedule.id))
    } else {
      ;({ error } = await supabase.from('class_schedules').insert([payload]))
    }
    if (error) { toast.error('บันทึกไม่สำเร็จ: ' + error.message); setSaving(false); return }
    toast.success(editSchedule ? 'แก้ไขตารางแล้ว' : 'เพิ่มคลาสแล้ว')
    setShowForm(false); setEditSchedule(null)
    setSaving(false)
    loadData()
  }

  async function deleteSchedule(id: string) {
    if (!confirm('ลบคลาสนี้ออกจากตาราง?')) return
    await supabase.from('class_schedules').update({ is_active: false }).eq('id', id)
    toast.success('ลบแล้ว')
    setShowStudentModal(null)
    loadData()
  }

  async function addStudent(scheduleId: string, studentId: string) {
    const schedule = schedules.find(s => s.id === scheduleId)
    const enroll = enrollments.find(e =>
      e.student_id === studentId &&
      (schedule?.course_id ? e.course_id === schedule.course_id : true)
    )
    const { error } = await supabase.from('schedule_students').insert({
      schedule_id: scheduleId,
      student_id: studentId,
      enrollment_id: enroll?.id ?? null,
    })
    if (error) { toast.error('เพิ่มไม่สำเร็จ (อาจซ้ำ)'); return }
    toast.success('เพิ่มนักเรียนแล้ว')
    loadData()
    const { data } = await supabase.from('class_schedules').select(`
      *, course:courses(name), teacher:profiles(full_name), room:rooms(name,color),
      schedule_students(student:students(nickname,full_name))
    `).eq('id', scheduleId).single()
    if (data) setShowStudentModal(data)
  }

  async function removeStudent(scheduleId: string, studentId: string) {
    await supabase.from('schedule_students')
      .delete().eq('schedule_id', scheduleId).eq('student_id', studentId)
    toast.success('ลบนักเรียนออกแล้ว')
    loadData()
    const { data } = await supabase.from('class_schedules').select(`
      *, course:courses(name), teacher:profiles(full_name), room:rooms(name,color),
      schedule_students(student:students(nickname,full_name))
    `).eq('id', scheduleId).single()
    if (data) setShowStudentModal(data)
  }

  function openAdd(day?: number) {
    setEditSchedule(null)
    setForm({
      course_id: '', room_id: rooms[0]?.id ?? '',
      teacher_id: '', day_of_week: day ?? 1,
      start_time: '14:00', end_time: '15:00', notes: '',
    })
    setShowForm(true)
  }

  function openEdit(s: Schedule) {
    setEditSchedule(s)
    setForm({
      course_id: s.course_id ?? '',
      room_id: s.room_id,
      teacher_id: s.teacher_id ?? '',
      day_of_week: s.day_of_week,
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
      notes: s.notes ?? '',
    })
    setShowForm(true)
  }

  const displayDays = selectedDay !== null ? [selectedDay] : [1,2,3,4,5,6,0]

  if (loading) return <div className="p-6 text-gray-400 dark:text-gray-300 text-center py-20">กำลังโหลด...</div>

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">ตารางสอน</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-0.5">{rooms.length} ห้อง · {schedules.length} คลาส/สัปดาห์</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/staff/schedule/connect"
            className="text-sm px-4 py-2 rounded-xl text-white font-medium hover:-translate-y-0.5 transition-all"
            style={{ background: '#3B9EE0' }}>
            Connect Google Calendar
          </a>
          <div className="flex rounded-lg border border-gray-200 dark:border-[#3a4560] overflow-hidden">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-3 py-1.5 text-xs transition-colors ${selectedDay === null ? 'bg-gray-900 text-white' : 'bg-white dark:bg-[#242d3f] text-gray-500 dark:text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:bg-[#1e2533]'}`}
            >ทั้งสัปดาห์</button>
            {[1,2,3,4,5,6,0].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                className={`px-3 py-1.5 text-xs transition-colors border-l border-gray-200 dark:border-[#3a4560] ${selectedDay === d ? 'bg-gray-900 text-white' : 'bg-white dark:bg-[#242d3f] text-gray-500 dark:text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:bg-[#1e2533]'}`}
              >{DAYS_SHORT[d]}</button>
            ))}
          </div>
          <button onClick={() => openAdd()} className="btn-brand">+ เพิ่มคลาส</button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1e2533]">
              <th className="w-16 px-3 py-3 text-xs text-gray-400 dark:text-gray-300 font-medium border-b border-r border-gray-100 dark:border-[#3a4560]">เวลา</th>
              {displayDays.map(d => (
                <th key={d} className={`px-3 py-3 text-xs font-medium border-b border-gray-100 dark:border-[#3a4560] text-center ${selectedDay === d ? 'bg-brand-50 text-brand-700' : 'text-gray-600 dark:text-gray-300'}`}>
                  {DAYS[d]}
                  <div className="text-[10px] font-normal text-gray-400 dark:text-gray-300 mt-0.5">
                    {schedules.filter(s => s.day_of_week === d).length} คลาส
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.slice(0, -1).map(time => (
              <tr key={time} className="hover:bg-gray-50 dark:bg-[#1e2533]/50">
                <td className="px-3 py-2 text-xs text-gray-400 dark:text-gray-300 border-r border-b border-gray-100 dark:border-[#3a4560] text-center align-top w-16">
                  {time}
                </td>
                {displayDays.map(d => {
                  const slot = schedules.find(s =>
                    s.day_of_week === d && s.start_time.slice(0,5) === time
                  )
                  const room = rooms.find(r => r.id === slot?.room_id)
                  const studentNames = (slot?.schedule_students ?? [])
                    .map(ss => ss.student?.nickname || ss.student?.full_name)
                    .filter(Boolean)

                  return (
                    <td key={d} className="border-b border-gray-100 dark:border-[#3a4560] p-1 align-top min-w-[140px]">
                      {slot ? (
                        <div
                          className="rounded-lg p-2 cursor-pointer hover:opacity-80 transition h-full"
                          style={{ background: (room?.color ?? '#ccc') + '22', borderLeft: `3px solid ${room?.color ?? '#ccc'}` }}
                          onClick={() => setShowStudentModal(slot)}
                        >
                          <div className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate">{slot.course?.name ?? 'ไม่ระบุ'}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-300 mt-0.5">{slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-300">{room?.name}</div>
                          {/* ชื่อครู */}
                          {slot.teacher?.full_name && (
                            <div className="text-[10px] text-brand-600 mt-0.5 truncate">
                              👩‍🏫 {slot.teacher.full_name}
                            </div>
                          )}
                          {/* ชื่อนักเรียน */}
                          {studentNames.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-0.5">
                              {studentNames.slice(0, 3).map((name, i) => (
                                <span key={i} className="text-[9px] bg-white dark:bg-[#242d3f]/70 rounded px-1 py-0.5 text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
                                  {name}
                                </span>
                              ))}
                              {studentNames.length > 3 && (
                                <span className="text-[9px] text-gray-400 dark:text-gray-300">+{studentNames.length - 3}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400 dark:text-gray-300">{slot.schedule_students?.length ?? 0}/{room?.capacity ?? '?'} คน</span>
                            <div className="flex gap-1">
                              <button
                                onClick={e => { e.stopPropagation(); openEdit(slot) }}
                                className="text-[10px] text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:text-gray-300"
                              >✎</button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteSchedule(slot.id) }}
                                className="text-[10px] text-red-300 hover:text-red-500"
                              >✕</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="h-10 rounded-lg border border-dashed border-gray-100 dark:border-[#3a4560] hover:border-brand-200 hover:bg-brand-50/30 cursor-pointer transition flex items-center justify-center"
                          onClick={() => openAdd(d)}
                        >
                          <span className="text-[10px] text-gray-200 hover:text-brand-400">+</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#242d3f] rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 dark:border-[#3a4560] flex items-center justify-between">
              <h2 className="font-semibold">{editSchedule ? 'แก้ไขคลาส' : 'เพิ่มคลาสใหม่'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 dark:text-gray-300">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div>
                <label className="label">วัน *</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4,5,6,0].map(d => (
                    <button type="button" key={d}
                      onClick={() => setForm({ ...form, day_of_week: d })}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${form.day_of_week === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-[#242d3f] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#3a4560] hover:border-gray-400'}`}
                    >{DAYS[d]}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">ห้องเรียน *</label>
                <div className="grid grid-cols-4 gap-2">
                  {rooms.map(room => {
                    const conflict = hasConflict(room.id, form.day_of_week, form.start_time, form.end_time, editSchedule?.id)
                    return (
                      <button type="button" key={room.id}
                        onClick={() => !conflict && setForm({ ...form, room_id: room.id })}
                        disabled={conflict}
                        className={`p-2 rounded-lg text-xs border text-center transition-all ${form.room_id === room.id ? 'border-current font-semibold' : conflict ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-[#1e2533] border-gray-100 dark:border-[#3a4560] text-gray-400 dark:text-gray-300' : 'border-gray-200 dark:border-[#3a4560] hover:border-gray-400'}`}
                        style={form.room_id === room.id ? { borderColor: room.color, color: room.color, background: room.color + '15' } : {}}
                      >
                        <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: room.color }} />
                        {room.name}
                        {conflict && <div className="text-[9px] text-red-400 mt-0.5">ไม่ว่าง</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">เริ่ม *</label>
                  <select className="input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}>
                    {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">สิ้นสุด *</label>
                  <select className="input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}>
                    {TIME_SLOTS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">วิชา / คอร์ส</label>
                <select className="input" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
                  <option value="">— ไม่ระบุ —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ครูผู้สอน</label>
                <select className="input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                  <option value="">— ไม่ระบุ —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">หมายเหตุ</label>
                <input className="input" placeholder="เช่น คลาสทดลองเรียน" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving || !form.room_id} className="btn-brand flex-1 justify-center">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#242d3f] rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 dark:border-[#3a4560] flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{showStudentModal.course?.name ?? 'คลาส'}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                  {DAYS[showStudentModal.day_of_week]} {showStudentModal.start_time.slice(0,5)}–{showStudentModal.end_time.slice(0,5)}
                  {showStudentModal.teacher?.full_name && ` · 👩‍🏫 ${showStudentModal.teacher.full_name}`}
                </p>
              </div>
              <button onClick={() => setShowStudentModal(null)} className="text-gray-400 dark:text-gray-300">✕</button>
            </div>
            <div className="p-4 max-h-52 overflow-y-auto divide-y divide-gray-50">
              {(showStudentModal.schedule_students ?? []).length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-300 text-center py-4">ยังไม่มีนักเรียน</p>
              )}
              {(showStudentModal.schedule_students ?? []).map((ss, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {(ss.student?.nickname || ss.student?.full_name || '?').slice(0,2)}
                    </div>
                    <span className="text-sm">{ss.student?.nickname || ss.student?.full_name}</span>
                  </div>
                  <button
                    onClick={() => {
                      const sid = students.find(s =>
                        (s.nickname || s.full_name) === (ss.student?.nickname || ss.student?.full_name)
                      )?.id
                      if (sid) removeStudent(showStudentModal.id, sid)
                    }}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >ลบ</button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-[#3a4560] space-y-3">
              <div>
                <label className="label">เพิ่มนักเรียน</label>
                <select className="input"
                  onChange={e => { if (e.target.value) addStudent(showStudentModal.id, e.target.value) }}
                  defaultValue=""
                >
                  <option value="">— เลือกนักเรียน —</option>
                  {students
                    .filter(s => !(showStudentModal.schedule_students ?? []).some(ss =>
                      (ss.student?.nickname || ss.student?.full_name) === (s.nickname || s.full_name)
                    ))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.nickname || s.full_name}</option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowStudentModal(null); openEdit(showStudentModal) }}
                  className="btn-outline flex-1 justify-center text-xs"
                >✎ แก้ไขคลาส</button>
                <button
                  onClick={() => deleteSchedule(showStudentModal.id)}
                  className="btn-outline flex-1 justify-center text-xs text-red-400 hover:bg-red-50"
                >🗑 ลบคลาส</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
