'use client'
// src/app/staff/students/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Enrollment } from '@/types'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

type StudentWithEnrollment = Student & {
  enrollments: (Enrollment & { course: { name: string } })[]
}

export default function StudentsPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<StudentWithEnrollment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState<StudentWithEnrollment | null>(null)
  const [enrollForm, setEnrollForm] = useState({
    course_id: '', lessons_total: 10, price: 0, payment_method: 'transfer', notes: ''
  })
  const [enrollSaving, setEnrollSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', nickname: '', date_of_birth: '',
    gender: 'female', parent_name: '', parent_phone: '', parent_line_id: '', notes: ''
  })

  async function loadStudents() {
    const { data } = await supabase
      .from('students')
      .select(`*, enrollments(*, course:courses(name))`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setStudents((data ?? []) as StudentWithEnrollment[])
    setLoading(false)
  }

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('id, name, price').eq('is_active', true)
    setCourses(data ?? [])
  }

  useEffect(() => { loadStudents(); loadCourses() }, [])

  const filtered = students.filter(s =>
    s.full_name.includes(search) ||
    (s.nickname ?? '').includes(search) ||
    (s.parent_name ?? '').includes(search)
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('students').insert([form])
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
    toast.success('เพิ่มนักเรียนแล้ว')
    setShowForm(false)
    setForm({ full_name: '', nickname: '', date_of_birth: '', gender: 'female', parent_name: '', parent_phone: '', parent_line_id: '', notes: '' })
    loadStudents()
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!showEnrollModal) return
    setEnrollSaving(true)

    const { data: enroll, error: enrollError } = await supabase
      .from('enrollments')
      .insert([{
        student_id: showEnrollModal.id,
        course_id: enrollForm.course_id || null,
        lessons_total: enrollForm.lessons_total,
        lessons_used: 0,
        status: 'active',
        notes: enrollForm.notes || null,
      }])
      .select()
      .single()

    if (enrollError) { toast.error('บันทึกไม่สำเร็จ: ' + enrollError.message); setEnrollSaving(false); return }

    if (enrollForm.price > 0) {
      await supabase.from('receipts').insert([{
        student_id: showEnrollModal.id,
        enrollment_id: enroll.id,
        amount: enrollForm.price,
        payment_method: enrollForm.payment_method,
        issued_at: new Date().toISOString(),
      }])
    }

    toast.success('ซื้อคอร์สเรียบร้อย 🎉')
    setShowEnrollModal(null)
    setEnrollForm({ course_id: '', lessons_total: 10, price: 0, payment_method: 'transfer', notes: '' })
    setEnrollSaving(false)
    loadStudents()
  }

  function openEnrollModal(student: StudentWithEnrollment) {
    setShowEnrollModal(student)
    setEnrollForm({ course_id: '', lessons_total: 10, price: 0, payment_method: 'transfer', notes: '' })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">ข้อมูลนักเรียน</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} คน</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-brand">
          + เพิ่มนักเรียน
        </button>
      </div>

      <div className="card mb-4 p-4 flex gap-3">
        <input
          className="input max-w-xs"
          placeholder="ค้นหาชื่อ, ชื่อเล่น, ผู้ปกครอง..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12">กำลังโหลด...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>อายุ</th>
                <th>คอร์สปัจจุบัน</th>
                <th>ความคืบหน้า</th>
                <th>ผู้ปกครอง</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const activeEnroll = s.enrollments?.find(e => e.status === 'active')
                const remaining = activeEnroll
                  ? activeEnroll.lessons_total - activeEnroll.lessons_used
                  : null
                const pct = activeEnroll
                  ? Math.round((activeEnroll.lessons_used / activeEnroll.lessons_total) * 100)
                  : 0

                return (
                  <tr key={s.id} className="table-row-hover">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
                          {getInitials(s.nickname || s.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{s.nickname || s.full_name}</div>
                          {s.nickname && <div className="text-xs text-gray-400">{s.full_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">
                      {s.date_of_birth
                        ? `${new Date().getFullYear() - new Date(s.date_of_birth).getFullYear()} ปี`
                        : '—'}
                    </td>
                    <td>
                      {activeEnroll
                        ? <span className="text-sm">{(activeEnroll.course as any)?.name}</span>
                        : <span className="text-gray-400 text-xs">ไม่มีคอร์ส</span>}
                    </td>
                    <td>
                      {activeEnroll && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            {activeEnroll.lessons_used}/{activeEnroll.lessons_total} ครั้ง
                            · <span className={remaining! <= 2 ? 'text-red-500 font-medium' : remaining! <= 5 ? 'text-amber-500 font-medium' : 'text-brand-600'}>
                              เหลือ {remaining} ครั้ง
                            </span>
                          </div>
                          <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 85 ? 'bg-red-400' : pct >= 65 ? 'bg-amber-400' : 'bg-brand-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-sm">{s.parent_name || '—'}</div>
                      {s.parent_phone && <div className="text-xs text-gray-400">{s.parent_phone}</div>}
                    </td>
                    <td>
                      {activeEnroll ? (
                        <span className={`badge ${
                          remaining! <= 2 ? 'badge-red' :
                          remaining! <= 5 ? 'badge-amber' : 'badge-green'
                        }`}>
                          {remaining! <= 2 ? 'เร่งด่วน' : remaining! <= 5 ? 'ใกล้หมด' : 'กำลังเรียน'}
                        </span>
                      ) : (
                        <span className="badge badge-gray">ไม่มีคอร์ส</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => openEnrollModal(s)} className="btn-outline btn-sm">
                        ซื้อคอร์ส
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">ไม่พบนักเรียน</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">ซื้อคอร์ส</h2>
                <p className="text-xs text-gray-400 mt-0.5">{showEnrollModal.nickname || showEnrollModal.full_name}</p>
              </div>
              <button onClick={() => setShowEnrollModal(null)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleEnroll} className="p-5 space-y-3.5">
              <div>
                <label className="label">คอร์ส</label>
                <select
                  className="input"
                  value={enrollForm.course_id}
                  onChange={e => {
                    const course = courses.find(c => c.id === e.target.value)
                    setEnrollForm({
                      ...enrollForm,
                      course_id: e.target.value,
                      lessons_total: course?.total_lessons ?? 10,
                      price: course?.price ?? 0
                    })
                  }}
                >
                  <option value="">— เลือกคอร์ส —</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">จำนวนครั้ง</label>
                <input
                  type="number" min={1} className="input"
                  value={enrollForm.lessons_total}
                  onChange={e => setEnrollForm({ ...enrollForm, lessons_total: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">ราคา (บาท)</label>
                <input
                  type="number" min={0} className="input"
                  value={enrollForm.price}
                  onChange={e => setEnrollForm({ ...enrollForm, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">ช่องทางชำระ</label>
                <select className="input" value={enrollForm.payment_method}
                  onChange={e => setEnrollForm({ ...enrollForm, payment_method: e.target.value })}>
                  <option value="transfer">โอนเงิน</option>
                  <option value="cash">เงินสด</option>
                  <option value="promptpay">พร้อมเพย์</option>
                </select>
              </div>
              <div>
                <label className="label">หมายเหตุ</label>
                <input className="input" placeholder="เช่น ต่อคอร์ส, โปรโมชัน..."
                  value={enrollForm.notes}
                  onChange={e => setEnrollForm({ ...enrollForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={enrollSaving} className="btn-brand flex-1 justify-center">
                  {enrollSaving ? 'กำลังบันทึก...' : 'ยืนยันซื้อคอร์ส'}
                </button>
                <button type="button" onClick={() => setShowEnrollModal(null)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">เพิ่มนักเรียนใหม่</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ชื่อ-นามสกุล *</label>
                  <input className="input" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                </div>
                <div>
                  <label className="label">ชื่อเล่น</label>
                  <input className="input" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">วันเกิด</label>
                  <input type="date" className="input" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                </div>
                <div>
                  <label className="label">เพศ</label>
                  <select className="input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="female">หญิง</option>
                    <option value="male">ชาย</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">ชื่อผู้ปกครอง</label>
                <input className="input" value={form.parent_name} onChange={e => setForm({...form, parent_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">เบอร์โทรผู้ปกครอง</label>
                  <input className="input" type="tel" value={form.parent_phone} onChange={e => setForm({...form, parent_phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">LINE ID ผู้ปกครอง</label>
                  <input className="input" value={form.parent_line_id} onChange={e => setForm({...form, parent_line_id: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">หมายเหตุ</label>
                <textarea className="input min-h-[70px] resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-brand flex-1 justify-center">บันทึก</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
