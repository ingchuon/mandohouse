'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatThaiMoney, getCourseTypeLabel, getCourseTypeClass } from '@/lib/utils'
import type { Course } from '@/types'
import toast from 'react-hot-toast'

const COURSE_TYPES = [
  { value: 'group', label: 'กลุ่ม (Group)' },
  { value: 'one_on_one', label: '1-on-1' },
  { value: 'kids', label: 'เด็ก (Kids)' },
  { value: 'hsk', label: 'HSK Prep' },
]

export default function CoursesPage() {
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'group', description: '', total_lessons: 12,
    duration_minutes: 60, price: 3000, max_students: 5
  })

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('*').order('price')
    setCourses(data ?? [])
  }

  useEffect(() => { loadCourses() }, [])

  function openEdit(c: Course) {
    setEditing(c)
    setForm({
      name: c.name, type: c.type, description: c.description || '',
      total_lessons: c.total_lessons, duration_minutes: c.duration_minutes,
      price: c.price, max_students: c.max_students
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price),
      total_lessons: Number(form.total_lessons),
      duration_minutes: Number(form.duration_minutes),
      max_students: Number(form.max_students)
    }
    if (editing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editing.id)
      if (error) { toast.error('แก้ไขไม่สำเร็จ'); return }
      toast.success('แก้ไขคอร์สแล้ว')
    } else {
      const { error } = await supabase.from('courses').insert([payload])
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
      toast.success('เพิ่มคอร์สแล้ว')
    }
    setShowForm(false)
    setEditing(null)
    loadCourses()
  }

  async function deleteCourse(c: Course) {
    if (!confirm(`ปิดคอร์ส "${c.name}" ใช่ไหม?`)) return
    const { error } = await supabase.from('courses').update({ is_active: false }).eq('id', c.id)
    if (error) { toast.error('ไม่สำเร็จ'); return }
    toast.success('ปิดคอร์สแล้ว')
    loadCourses()
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">คอร์สและราคา</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการคอร์สเรียนทั้งหมด</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-brand">+ เพิ่มคอร์ส</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c.id} className={`card p-4 md:p-5 ${!c.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`badge ${getCourseTypeClass(c.type)}`}>{getCourseTypeLabel(c.type)}</span>
              <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'เปิดรับ' : 'ปิด'}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{c.name}</h3>
            {c.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
            <div className="text-xl md:text-2xl font-semibold text-brand-600 mb-0.5">{formatThaiMoney(c.price)}</div>
            <div className="text-xs text-gray-400 mb-3">/ {c.total_lessons} ครั้ง</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-50 pt-3 flex-wrap">
              <span>👥 สูงสุด {c.max_students} คน</span>
              <span>⏱ {c.duration_minutes} นาที/ครั้ง</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(c)} className="btn-outline btn-sm flex-1 justify-center">แก้ไข</button>
              <button
                onClick={() => supabase.from('courses').update({ is_active: !c.is_active }).eq('id', c.id).then(loadCourses)}
                className="btn-outline btn-sm flex-1 justify-center text-gray-500"
              >
                {c.is_active ? 'ปิด' : 'เปิด'}
              </button>
              <button onClick={() => deleteCourse(c)} className="btn-outline btn-sm px-2 text-red-400 hover:bg-red-50 hover:border-red-200">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold">{editing ? 'แก้ไขคอร์ส' : 'เพิ่มคอร์สใหม่'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div>
                <label className="label">ชื่อคอร์ส *</label>
                <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ประเภทคอร์ส</label>
                  <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {COURSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">ราคา (฿)</label>
                  <input type="number" className="input" required value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">จำนวนครั้ง</label>
                  <input type="number" className="input" value={form.total_lessons} onChange={e => setForm({...form, total_lessons: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">นาที/ครั้ง</label>
                  <input type="number" className="input" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">นักเรียนสูงสุด</label>
                  <input type="number" className="input" value={form.max_students} onChange={e => setForm({...form, max_students: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="label">รายละเอียด</label>
                <textarea className="input min-h-[70px] resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
