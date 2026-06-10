'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Enrollment } from '@/types'
import toast from 'react-hot-toast'

export default function CheckinPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [checkins, setCheckins] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [isBackdate, setIsBackdate] = useState(false)
  const [now, setNow] = useState(new Date())
  const [editCheckin, setEditCheckin] = useState<any>(null)
  const [editForm, setEditForm] = useState({ check_in_at: '', check_out_at: '', lesson_note: '' })
  const [noteCheckin, setNoteCheckin] = useState<any>(null)
  const [noteText, setNoteText] = useState('')

  // date picker state — default = today
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const isToday = selectedDate === todayStr

  useEffect(() => {
    loadStudentsAndEnrollments()
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    loadCheckins(selectedDate)
  }, [selectedDate])

  async function loadStudentsAndEnrollments() {
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('nickname'),
      supabase.from('enrollments').select('*, course:courses(name)').eq('status', 'active'),
    ])
    setStudents(s ?? [])
    setEnrollments(e ?? [])
  }

  async function loadCheckins(date: string) {
    const { data: c } = await supabase
      .from('checkins')
      .select('*, student:students(full_name, nickname), enrollment:enrollments(*, course:courses(name))')
      .gte('check_in_at', date + 'T00:00:00')
      .lt('check_in_at', date + 'T23:59:59')
      .order('check_in_at', { ascending: false })
    setCheckins(c ?? [])
  }

  async function loadData() {
    await Promise.all([loadStudentsAndEnrollments(), loadCheckins(selectedDate)])
  }

  async function handleCheckin() {
    if (!selectedStudent) { toast.error('กรุณาเลือกนักเรียน'); return }
    if (isBackdate && !customDate) { toast.error('กรุณาเลือกวันที่และเวลา'); return }
    setLoading(true)
    const enrollment = enrollments.find(e => e.student_id === selectedStudent)
    const checkinTime = isBackdate && customDate
      ? new Date(customDate).toISOString()
      : new Date().toISOString()
    const { error } = await supabase.from('checkins').insert({
      student_id: selectedStudent,
      enrollment_id: enrollment?.id,
      check_in_at: checkinTime,
    })
    if (error) { toast.error('เช็กอินไม่สำเร็จ'); setLoading(false); return }
    toast.success(isBackdate ? 'บันทึกย้อนหลังสำเร็จ!' : 'เช็กอินสำเร็จ!')
    setSelectedStudent('')
    setStudentSearch('')
    setCustomDate('')
    // ถ้า backdate ให้กระโดดไปดูวันนั้น
    if (isBackdate && customDate) {
      const backdateDay = customDate.slice(0, 10)
      setSelectedDate(backdateDay)
    }
    loadData()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    const { error } = await supabase.from('checkins').delete().eq('id', id)
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบแล้ว')
    loadCheckins(selectedDate)
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

  // สถิติของวันที่เลือก
  const presentCount = checkins.length
  const checkedOutCount = checkins.filter(c => c.check_out_at).length
  const stillInCount = checkins.filter(c => !c.check_out_at).length

  // filter นักเรียนตาม search
  const filteredStudents = students.filter(s =>
    !studentSearch ||
    (s.nickname ?? '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const fmt = (d: Date) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg md:text-xl font-semibold mb-1">เช็กอิน / เช็กเอาท์</h1>
      <p className="text-sm text-gray-500 mb-6">บันทึกเวลาเข้าออกของนักเรียน</p>

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
                onChange={e => { setStudentSearch(e.target.value); setSelectedStudent('') }}
              />
              <select
                className="input"
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
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

            {selectedStudent && (
              <div className="bg-brand-50 rounded-xl px-3 py-2 text-sm text-brand-700 font-medium">
                ✓ {students.find(s => s.id === selectedStudent)?.nickname || students.find(s => s.id === selectedStudent)?.full_name}
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

            <button
              onClick={handleCheckin}
              disabled={loading || !selectedStudent || (isBackdate && !customDate)}
              className="btn-brand w-full justify-center py-2.5"
            >
              {loading ? 'กำลังบันทึก...' : isBackdate ? '📅 บันทึกย้อนหลัง' : '✓ เช็กอิน'}
            </button>
          </div>
        </div>

        {/* Attendance panel with date picker */}
        <div className="md:col-span-2 card">
          {/* Date navigation */}
          <div className="card-header gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => goDate(-1)}
                className="btn-outline btn-sm px-2.5 py-1"
              >
                ←
              </button>
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
              >
                →
              </button>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {formatDateTH(selectedDate)}
              </span>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="btn-outline btn-sm px-2.5 py-1 text-brand-600 border-brand-200 hover:bg-brand-50"
                >
                  วันนี้
                </button>
              )}
            </div>
            <span className="badge badge-green">{presentCount} คน</span>
          </div>

          {/* Summary stats */}
          {presentCount > 0 && (
            <div className="px-5 py-3 border-b border-gray-50 flex gap-4 text-sm">
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

          {/* Checkin list */}
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
                      <div className="text-xs text-gray-400">{c.enrollment?.course?.name || 'ไม่มีคอร์ส'}</div>
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
              <div>
                <label className="label">เนื้อหาที่สอนวันนี้</label>
                <textarea
                  className="input min-h-[120px] resize-none"
                  placeholder="เช่น บทที่ 3 คำศัพท์เรื่องครอบครัว, ฝึกอ่านประโยค..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
              </div>
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
