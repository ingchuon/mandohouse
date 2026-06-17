'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Enrollment } from '@/types'
import toast from 'react-hot-toast'

interface Teacher {
  id: string
  full_name: string
  subject: string | null
}

export default function CheckinPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [checkins, setCheckins] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [isBackdate, setIsBackdate] = useState(false)
  const [now, setNow] = useState(new Date())
  const [editCheckin, setEditCheckin] = useState<any>(null)
  const [editForm, setEditForm] = useState({ check_in_at: '', check_out_at: '', lesson_note: '' })
  const [noteCheckin, setNoteCheckin] = useState<any>(null)
  const [noteText, setNoteText] = useState('')

  // ฟอร์มบันทึกการสอน (ครู / เวลา / หัวข้อ / การบ้าน)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [subjectName, setSubjectName] = useState('')
  const [topic, setTopic] = useState('')
  const [homework, setHomework] = useState('')

  const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const isToday = selectedDate === todayStr

  useEffect(() => {
    loadStudentsAndEnrollments()
    loadTeachers()
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    loadCheckins(selectedDate)
  }, [selectedDate])

  // เมื่อเลือกนักเรียน → หา enrollment active
  // 1 คอร์ส → set อัตโนมัติ / หลายคอร์ส → รอให้เลือก
  useEffect(() => {
    if (!selectedStudent) { setSelectedEnrollmentId(''); return }
    const list = enrollments.filter(e => e.student_id === selectedStudent)
    if (list.length === 1) setSelectedEnrollmentId(list[0].id)
    else setSelectedEnrollmentId('')
  }, [selectedStudent, enrollments])

  async function loadStudentsAndEnrollments() {
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('nickname'),
      supabase.from('enrollments').select('*, course:courses(name)').eq('status', 'active'),
    ])
    setStudents(s ?? [])
    setEnrollments(e ?? [])
  }

  async function loadTeachers() {
    const { data } = await supabase
      .from('teachers')
      .select('id, full_name, subject')
      .eq('is_active', true)
      .not('full_name', 'ilike', '%&%')
      .order('full_name')
    setTeachers((data as Teacher[]) ?? [])
  }

  async function loadCheckins(date: string) {
    // Auto-close checkins ที่ค้างข้ามวัน (ตั้ง check_out_at = 20:00 ของวันนั้น)
    if (date === todayStr) {
      await supabase.rpc('close_overnight_checkins').catch(() => {})
    }

    const { data: c } = await supabase
      .from('checkins')
      .select('*, student:students(full_name, nickname), enrollment:enrollments(*, course:courses(name))')
      .gte('check_in_at', date + 'T00:00:00+07:00')
      .lt('check_in_at', date + 'T23:59:59+07:00')
      .order('check_in_at', { ascending: false })
    setCheckins(c ?? [])
  }

  async function loadData() {
    await Promise.all([loadStudentsAndEnrollments(), loadCheckins(selectedDate)])
  }

  async function handleCheckin() {
    if (!selectedStudent) { toast.error('กรุณาเลือกนักเรียน'); return }
    const list = enrollments.filter(e => e.student_id === selectedStudent)
    if (list.length > 1 && !selectedEnrollmentId) {
      toast.error('กรุณาเลือกคอร์สที่จะเช็กอิน'); return
    }
    if (isBackdate && !customDate) { toast.error('กรุณาเลือกวันที่และเวลา'); return }

    setLoading(true)
    const enrollmentId = selectedEnrollmentId || list[0]?.id || null
    const checkinTime = isBackdate && customDate
      ? new Date(customDate).toISOString()
      : new Date().toISOString()
    const lessonDate = checkinTime.slice(0, 10)
    const enroll = enrollments.find(e => e.id === enrollmentId)
    const teacher = teachers.find(t => t.id === selectedTeacherId)

    // 1) บันทึกเช็กอิน
    const { error } = await supabase.from('checkins').insert({
      student_id: selectedStudent,
      enrollment_id: enrollmentId,
      check_in_at: checkinTime,
    })
    if (error) { toast.error('เช็กอินไม่สำเร็จ'); setLoading(false); return }

    // 2) ถ้าระบุครู/หัวข้อ/การบ้าน → บันทึกชั่วโมงสอนด้วย (lesson_logs)
    if (enrollmentId && (teacher || topic || homework)) {
      // ตรวจสอบบันทึกซ้ำ: enrollment นี้ + วันนี้ มีบันทึกอยู่แล้วหรือไม่ (เช่น ครูกรอกที่ /teach ไปแล้ว)
      const { data: existing } = await supabase
        .from('lesson_logs')
        .select('id, teacher_name, duration_minutes, subject_name')
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_date', lessonDate)

      const courseName = enroll?.course?.name ?? ''
      const isSpecialCourse = /special/i.test(courseName)
      let skipLessonCount = false

      if (existing && existing.length > 0) {
        const who = existing[0].teacher_name ? `ครู${existing[0].teacher_name}` : 'staff'
        const prevSubject = existing[0].subject_name ? ` (วิชา${existing[0].subject_name})` : ''

        if (isSpecialCourse) {
          const confirmed = confirm(
            `วันนี้มีบันทึกชั่วโมงสอนของคอร์สนี้อยู่แล้ว (${courseName})\n` +
            `บันทึกโดย: ${who}${prevSubject}${existing[0].duration_minutes ? ` (${existing[0].duration_minutes} นาที)` : ''}\n\n` +
            `ต้องการเช็กอิน + บันทึกชั่วโมงสอนของวิชานี้เพิ่มหรือไม่?\n` +
            `(กด ตกลง = บันทึกเพิ่ม โดยไม่หักครั้งเรียนซ้ำ / ยกเลิก = เช็กอินอย่างเดียว)`
          )
          if (!confirmed) {
            toast.success(isBackdate ? 'บันทึกย้อนหลังสำเร็จ! (เช็กอินอย่างเดียว)' : 'เช็กอินสำเร็จ! (ไม่บันทึกชั่วโมงสอนซ้ำ)')
            setSelectedStudent('')
            setSelectedEnrollmentId('')
            setSelectedTeacherId('')
            setStudentSearch('')
            setCustomDate('')
            setDurationMinutes(60)
            setSubjectName('')
            setTopic('')
            setHomework('')
            if (isBackdate && customDate) setSelectedDate(customDate.slice(0, 10))
            loadData()
            setLoading(false)
            return
          }
          skipLessonCount = true
        } else {
          const confirmed = confirm(
            `วันนี้มีบันทึกชั่วโมงสอนของคอร์สนี้อยู่แล้ว (${courseName})\n` +
            `บันทึกโดย: ${who}${existing[0].duration_minutes ? ` (${existing[0].duration_minutes} นาที)` : ''}\n\n` +
            `ต้องการเช็กอิน + บันทึกชั่วโมงสอนซ้ำอีกครั้งหรือไม่?\n(กด ตกลง = บันทึกเพิ่ม / ยกเลิก = เช็กอินอย่างเดียว ไม่บันทึกชั่วโมงสอนซ้ำ)`
          )
          if (!confirmed) {
            toast.success(isBackdate ? 'บันทึกย้อนหลังสำเร็จ! (เช็กอินอย่างเดียว)' : 'เช็กอินสำเร็จ! (ไม่บันทึกชั่วโมงสอนซ้ำ)')
            setSelectedStudent('')
            setSelectedEnrollmentId('')
            setSelectedTeacherId('')
            setStudentSearch('')
            setCustomDate('')
            setDurationMinutes(60)
            setSubjectName('')
            setTopic('')
            setHomework('')
            if (isBackdate && customDate) setSelectedDate(customDate.slice(0, 10))
            loadData()
            setLoading(false)
            return
          }
        }
      }

      const { data: last } = await supabase
        .from('lesson_logs')
        .select('lesson_number')
        .eq('enrollment_id', enrollmentId)
        .order('lesson_number', { ascending: false })
        .limit(1)
        .single()

      const nextLesson = (last?.lesson_number ?? 0) + 1

      const { error: logError } = await supabase.from('lesson_logs').insert({
        enrollment_id: enrollmentId,
        student_id: selectedStudent,
        teacher_name: teacher?.full_name ?? null,
        lesson_date: lessonDate,
        lesson_number: nextLesson,
        duration_minutes: durationMinutes,
        subject_name: subjectName || null,
        topic: topic || null,
        homework: homework || null,
      })

      if (!logError && enroll && !skipLessonCount) {
        await supabase
          .from('enrollments')
          .update({ lessons_used: enroll.lessons_used + 1 })
          .eq('id', enrollmentId)
      }
    }

    const courseName = enroll?.course?.name ?? ''
    toast.success(isBackdate ? 'บันทึกย้อนหลังสำเร็จ!' : `เช็กอินสำเร็จ! ${courseName}`)

    setSelectedStudent('')
    setSelectedEnrollmentId('')
    setSelectedTeacherId('')
    setStudentSearch('')
    setCustomDate('')
    setDurationMinutes(60)
    setSubjectName('')
    setTopic('')
    setHomework('')
    if (isBackdate && customDate) setSelectedDate(customDate.slice(0, 10))
    loadData()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const item = checkins.find(c => c.id === id)
    if (!item) return

    // หา lesson_log ที่สร้างพร้อมกับ checkin นี้ (enrollment เดียวกัน + วันเดียวกัน)
    const lessonDate = item.check_in_at.slice(0, 10)
    const { data: relatedLogs } = await supabase
      .from('lesson_logs')
      .select('id, enrollment_id, lesson_number')
      .eq('enrollment_id', item.enrollment_id)
      .eq('lesson_date', lessonDate)

    // ซ่อนออกจาก UI ทันที
    setCheckins(prev => prev.filter(c => c.id !== id))

    let undone = false
    const timeoutId = setTimeout(async () => {
      if (undone) return

      // 1) ลบ checkin
      const { error } = await supabase.from('checkins').delete().eq('id', id)
      if (error) { toast.error('ลบไม่สำเร็จ'); loadCheckins(selectedDate); return }

      // 2) ลบ lesson_logs ที่เกี่ยวข้อง
      if (relatedLogs && relatedLogs.length > 0) {
        await supabase.from('lesson_logs').delete()
          .in('id', relatedLogs.map(l => l.id))

        // 3) คืน lessons_used (ลดลงเท่ากับจำนวน lesson_logs ที่ลบ)
        if (item.enrollment_id) {
          const { data: enroll } = await supabase
            .from('enrollments')
            .select('lessons_used')
            .eq('id', item.enrollment_id)
            .single()
          if (enroll && enroll.lessons_used > 0) {
            await supabase
              .from('enrollments')
              .update({ lessons_used: Math.max(0, enroll.lessons_used - relatedLogs.length) })
              .eq('id', item.enrollment_id)
          }
        }
      }
    }, 6000)

    const studentName = item.student?.nickname || item.student?.full_name || 'นักเรียน'
    const logCount = relatedLogs?.length ?? 0

    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span>
            ลบเช็กอิน {studentName} แล้ว
            {logCount > 0 && <span className="text-xs text-gray-400 ml-1">(คืน {logCount} ครั้ง)</span>}
          </span>
          <button
            onClick={() => {
              undone = true
              clearTimeout(timeoutId)
              setCheckins(prev => {
                if (prev.some(c => c.id === item.id)) return prev
                return [item, ...prev].sort((a, b) => new Date(b.check_in_at).getTime() - new Date(a.check_in_at).getTime())
              })
              toast.dismiss(t.id)
              toast.success('เลิกทำแล้ว')
            }}
            className="font-medium text-brand-600 underline whitespace-nowrap"
          >
            เลิกทำ (Undo)
          </button>
        </span>
      ),
      { duration: 6000 }
    )
  }

  function openEdit(c: any) {
    setEditCheckin(c)
    const toLocal = (iso: string) => {
      const d = new Date(iso)
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }
    setEditForm({
      check_in_at: toLocal(c.check_in_at),
      check_out_at: c.check_out_at ? toLocal(c.check_out_at) : '',
      lesson_note: c.lesson_note || '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('checkins').update({
      check_in_at: new Date(editForm.check_in_at).toISOString(),
      check_out_at: editForm.check_out_at ? new Date(editForm.check_out_at).toISOString() : null,
      lesson_note: editForm.lesson_note || null,
    }).eq('id', editCheckin.id)
    if (error) { toast.error('แก้ไขไม่สำเร็จ'); return }
    toast.success('แก้ไขแล้ว')
    setEditCheckin(null)
    loadCheckins(selectedDate)
  }

  function openNote(c: any) {
    setNoteCheckin(c)
    setNoteText(c.lesson_note || '')
  }

  async function handleSaveNote() {
    const { error } = await supabase.from('checkins')
      .update({ lesson_note: noteText })
      .eq('id', noteCheckin.id)
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
    toast.success('บันทึกบทเรียนแล้ว ✅')
    setNoteCheckin(null)
    loadCheckins(selectedDate)
  }

  function goDate(offset: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    const next = d.toISOString().split('T')[0]
    if (next <= todayStr) setSelectedDate(next)
  }

  function formatDateTH(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    if (dateStr === todayStr) return 'วันนี้'
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'เมื่อวาน'
    return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const presentCount = checkins.length
  const checkedOutCount = checkins.filter(c => c.check_out_at).length
  const stillInCount = checkins.filter(c => !c.check_out_at).length

  const filteredStudents = students.filter(s =>
    !studentSearch ||
    (s.nickname ?? '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const studentEnrollments = selectedStudent
    ? enrollments.filter(e => e.student_id === selectedStudent)
    : []
  const hasMultipleCourses = studentEnrollments.length > 1
  const autoEnrollment = studentEnrollments.length === 1 ? studentEnrollments[0] : null

  const checkinDisabled = loading
    || !selectedStudent
    || !selectedTeacherId
    || (hasMultipleCourses && !selectedEnrollmentId)
    || (isBackdate && !customDate)

  const fmt = (d: Date) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  function fmtDuration(min: number | null) {
    if (!min) return null
    if (min < 60) return `${min} น.`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}ชม. ${m}น.` : `${h} ชม.`
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg md:text-xl font-semibold mb-1">เช็กอิน / เช็กเอาท์</h1>
      <p className="text-sm text-gray-500 mb-6">บันทึกเวลาเข้าออกของนักเรียน พร้อมข้อมูลการสอน</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quick check-in panel */}
        <div className="card">
          <div className="card-header"><h3 className="font-medium">เช็กอินด่วน</h3></div>
          <div className="p-5 space-y-4">
            <div className="text-center bg-brand-50 rounded-xl p-4">
              <div className="text-3xl font-semibold text-brand-700">{fmt(now)}</div>
              <div className="text-xs text-brand-600 mt-1">เวลาปัจจุบัน</div>
            </div>

            <div>
              <label className="label">ค้นหานักเรียน</label>
              <input
                className="input mb-2"
                placeholder="พิมพ์ชื่อหรือชื่อเล่น..."
                value={studentSearch}
                onChange={e => {
                  setStudentSearch(e.target.value)
                  setSelectedStudent('')
                  setSelectedEnrollmentId('')
                }}
              />
              <select
                className="input"
                value={selectedStudent}
                onChange={e => {
                  setSelectedStudent(e.target.value)
                  setStudentSearch('')
                }}
                size={Math.min(filteredStudents.length + 1, 6)}
              >
                <option value="">— เลือกนักเรียน —</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nickname || s.full_name}
                    {s.nickname ? ` (${s.full_name})` : ''}
                  </option>
                ))}
              </select>
              {studentSearch && filteredStudents.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">ไม่พบนักเรียน</p>
              )}
            </div>

            {/* แสดงหลังเลือกนักเรียน */}
            {selectedStudent && (
              <div className="space-y-3">
                {/* คอร์สเดียว — auto */}
                {autoEnrollment && (
                  <div className="flex items-center gap-2 bg-brand-50 rounded-xl px-3 py-2.5">
                    <span className="text-brand-500 text-base">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-brand-700 truncate">
                        {autoEnrollment.course?.name || 'ไม่มีชื่อคอร์ส'}
                      </div>
                      <div className="text-xs text-brand-400">เลือกอัตโนมัติ (คอร์สเดียว)</div>
                    </div>
                  </div>
                )}

                {/* หลายคอร์ส — ให้เลือก */}
                {hasMultipleCourses && (
                  <div>
                    <label className="label flex items-center gap-1.5">
                      เลือกคอร์สที่จะเช็กอิน
                      <span className="text-orange-500 text-xs font-normal">* จำเป็น</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      {studentEnrollments.map(enr => (
                        <button
                          key={enr.id}
                          onClick={() => setSelectedEnrollmentId(enr.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                            selectedEnrollmentId === enr.id
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              selectedEnrollmentId === enr.id ? 'border-brand-500' : 'border-gray-300'
                            }`}>
                              {selectedEnrollmentId === enr.id && (
                                <div className="w-2 h-2 rounded-full bg-brand-500" />
                              )}
                            </div>
                            <span className={`text-sm font-medium truncate ${
                              selectedEnrollmentId === enr.id ? 'text-brand-700' : 'text-gray-700'
                            }`}>
                              {enr.course?.name || 'ไม่มีชื่อคอร์ส'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ไม่มีคอร์ส */}
                {studentEnrollments.length === 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-sm text-orange-700">
                    ⚠️ นักเรียนไม่มีคอร์ส active
                  </div>
                )}

                {/* ครูผู้สอน */}
                <div>
                  <label className="label">ครูผู้สอน <span className="text-red-400">*</span></label>
                  <select
                    className="input"
                    value={selectedTeacherId}
                    onChange={e => setSelectedTeacherId(e.target.value)}
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}{t.subject ? ` (${t.subject})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* วิชาที่สอน (สำหรับคอร์สพิเศษหลายวิชา) */}
                <div>
                  <label className="label">วิชาที่สอน (ถ้ามี)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['ภาษาจีน', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์'].map(subj => (
                      <button
                        key={subj}
                        onClick={() => setSubjectName(prev => prev === subj ? '' : subj)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          subjectName === subj
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'border-gray-200 text-gray-600 hover:border-brand-400'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ใส่สำหรับคอร์สพิเศษหลายวิชา (Special) เพื่อให้นับชั่วโมงสอนแยกตามวิชา
                  </p>
                </div>

                {/* ระยะเวลา */}
                <div>
                  <label className="label">ระยะเวลาเรียน</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[30, 45, 60, 90, 120].map(m => (
                      <button
                        key={m}
                        onClick={() => setDurationMinutes(m)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          durationMinutes === m
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'border-gray-200 text-gray-600 hover:border-brand-400'
                        }`}
                      >
                        {m >= 60 ? `${m / 60}ชม.` : `${m}น.`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* หัวข้อที่สอน */}
                <div>
                  <label className="label">สอนอะไรบ้าง (ถ้ามี)</label>
                  <input
                    className="input"
                    placeholder="เช่น บทที่ 3 คำศัพท์เรื่องครอบครัว"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>

                {/* การบ้าน */}
                <div>
                  <label className="label">การบ้าน (ถ้ามี)</label>
                  <input
                    className="input"
                    placeholder="เช่น ฝึกพินอิน หน้า 20-25"
                    value={homework}
                    onChange={e => setHomework(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ย้อนหลัง toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsBackdate(!isBackdate); setCustomDate('') }}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isBackdate ? 'bg-brand-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isBackdate ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-gray-600">บันทึกย้อนหลัง</span>
            </div>

            {isBackdate && (
              <div>
                <label className="label">วันที่และเวลา</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            {selectedStudent && !selectedTeacherId && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-700">
                ⚠️ กรุณาเลือกครูผู้สอนก่อนกดเช็กอิน
              </div>
            )}

            <button
              onClick={handleCheckin}
              disabled={checkinDisabled}
              className="btn-brand w-full justify-center py-2.5"
            >
              {loading ? 'กำลังบันทึก...' : isBackdate ? '📅 บันทึกย้อนหลัง' : '✓ เช็กอิน'}
            </button>
          </div>
        </div>

        {/* Attendance panel */}
        <div className="md:col-span-2 card">
          <div className="card-header gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={() => goDate(-1)} className="btn-outline btn-sm px-2.5 py-1">←</button>
              <div className="relative flex-1 max-w-[180px]">
                <input
                  type="date"
                  className="input text-sm py-1.5 pr-8"
                  value={selectedDate}
                  max={todayStr}
                  onChange={e => e.target.value && setSelectedDate(e.target.value)}
                />
              </div>
              <button
                onClick={() => goDate(1)}
                disabled={selectedDate >= todayStr}
                className="btn-outline btn-sm px-2.5 py-1 disabled:opacity-30"
              >→</button>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {formatDateTH(selectedDate)}
              </span>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="btn-outline btn-sm px-2.5 py-1 text-brand-600 border-brand-200 hover:bg-brand-50"
                >วันนี้</button>
              )}
            </div>
            <span className="badge badge-green">{presentCount} คน</span>
          </div>

          {presentCount > 0 && (
            <div className="px-5 py-3 border-b border-gray-50 flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
                <span className="text-gray-600">มาเรียน</span>
                <span className="font-semibold text-brand-700">{presentCount} คน</span>
              </div>
              {checkedOutCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                  <span className="text-gray-600">ออกแล้ว</span>
                  <span className="font-semibold text-gray-700">{checkedOutCount} คน</span>
                </div>
              )}
              {stillInCount > 0 && isToday && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
                  <span className="text-gray-600">ยังอยู่</span>
                  <span className="font-semibold text-yellow-700">{stillInCount} คน</span>
                </div>
              )}
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {checkins.length === 0 && (
              <p className="text-center text-gray-400 py-10 text-sm">
                {isToday ? 'ยังไม่มีการเช็กอินวันนี้' : `ไม่มีข้อมูลวันที่ ${formatDateTH(selectedDate)}`}
              </p>
            )}
            {checkins.map(c => {
              const name = c.student?.nickname || c.student?.full_name || '?'
              const inTime = new Date(c.check_in_at)
              const outTime = c.check_out_at ? new Date(c.check_out_at) : null
              const duration = outTime ? Math.round((outTime.getTime() - inTime.getTime()) / 60000) : null
              return (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                      {name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {c.enrollment?.course?.name || 'ไม่มีคอร์ส'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm">
                        <span className="text-brand-600 font-medium">{fmt(inTime)}</span>
                        {outTime && <span className="text-gray-400"> → {fmt(outTime)}</span>}
                      </div>
                      {duration && <div className="text-xs text-gray-400">{duration} นาที</div>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap">
                      {c.check_out_at
                        ? <span className="badge badge-gray text-xs">ออกแล้ว</span>
                        : <span className="badge badge-green text-xs">อยู่</span>
                      }
                      <button
                        onClick={() => openNote(c)}
                        className={`btn-outline btn-sm px-2 ${c.lesson_note ? 'text-green-600' : 'text-gray-400'}`}
                        title="บันทึกบทเรียน"
                      >📝</button>
                      <button onClick={() => openEdit(c)} className="btn-outline btn-sm px-2">✎</button>
                      <button onClick={() => handleDelete(c.id)} className="btn-outline btn-sm px-2 text-red-400 hover:bg-red-50">✕</button>
                    </div>
                  </div>
                  {c.lesson_note && (
                    <div className="mt-2 ml-12 text-xs text-gray-500 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-100">
                      📖 {c.lesson_note}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lesson Note Modal */}
      {noteCheckin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">📝 บันทึกบทเรียน</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {noteCheckin.student?.nickname || noteCheckin.student?.full_name} — {noteCheckin.enrollment?.course?.name || 'ไม่มีคอร์ส'}
                </p>
              </div>
              <button onClick={() => setNoteCheckin(null)} className="text-gray-400">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <label className="label">เนื้อหาที่สอนวันนี้</label>
              <textarea
                className="input min-h-[120px] resize-none"
                placeholder="เช่น บทที่ 3 คำศัพท์เรื่องครอบครัว, ฝึกอ่านประโยค..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveNote} className="btn-brand flex-1 justify-center">บันทึก</button>
                <button onClick={() => setNoteCheckin(null)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editCheckin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">แก้ไขเวลา</h2>
              <button onClick={() => setEditCheckin(null)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-3">
              <div>
                <label className="label">เวลาเช็กอิน</label>
                <input type="datetime-local" className="input" value={editForm.check_in_at}
                  onChange={e => setEditForm({ ...editForm, check_in_at: e.target.value })} />
              </div>
              <div>
                <label className="label">เวลาเช็กเอาท์ (ถ้ามี)</label>
                <input type="datetime-local" className="input" value={editForm.check_out_at}
                  onChange={e => setEditForm({ ...editForm, check_out_at: e.target.value })} />
              </div>
              <div>
                <label className="label">บันทึกบทเรียน</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="เนื้อหาที่สอน..."
                  value={editForm.lesson_note}
                  onChange={e => setEditForm({ ...editForm, lesson_note: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-brand flex-1 justify-center">บันทึก</button>
                <button type="button" onClick={() => setEditCheckin(null)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
