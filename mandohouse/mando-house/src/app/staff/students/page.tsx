'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Enrollment } from '@/types'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

type StudentWithEnrollment = Student & {
  enrollments: (Enrollment & { course: { name: string } })[]
}

export default function StudentsPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<StudentWithEnrollment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editStudent, setEditStudent] = useState<StudentWithEnrollment | null>(null)
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
    let query = supabase
      .from('students')
      .select(`*, enrollments(*, course:courses(name))`)
      .order('created_at', { ascending: false })
    if (filterStatus !== 'all') {
      query = query.eq('is_active', filterStatus === 'active')
    }
    const { data } = await query
    setStudents((data ?? []) as StudentWithEnrollment[])
    setLoading(false)
  }

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('id, name, price, total_lessons').eq('is_active', true)
    setCourses(data ?? [])
  }

  useEffect(() => { loadStudents(); loadCourses() }, [filterStatus])

  const filtered = students.filter(s =>
    s.full_name.includes(search) ||
    (s.nickname ?? '').includes(search) ||
    (s.parent_name ?? '').includes(search)
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (editStudent) {
      const { error } = await supabase.from('students').update(form).eq('id', editStudent.id)
      if (error) { toast.error('แก้ไขไม่สำเร็จ'); return }
      toast.success('แก้ไขข้อมูลแล้ว')
    } else {
      const { error } = await supabase.from('students').insert([form])
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
      toast.success('เพิ่มนักเรียนแล้ว')
    }
    setShowForm(false)
    setEditStudent(null)
    setForm({ full_name: '', nickname: '', date_of_birth: '', gender: 'female', parent_name: '', parent_phone: '', parent_line_id: '', notes: '' })
    loadStudents()
  }

  function openEdit(s: StudentWithEnrollment) {
    setEditStudent(s)
    setForm({
      full_name: s.full_name,
      nickname: s.nickname ?? '',
      date_of_birth: s.date_of_birth ?? '',
      gender: s.gender ?? 'female',
      parent_name: s.parent_name ?? '',
      parent_phone: s.parent_phone ?? '',
      parent_line_id: s.parent_line_id ?? '',
      notes: s.notes ?? '',
    })
    setShowForm(true)
  }

  async function toggleActive(s: StudentWithEnrollment) {
    const newStatus = !s.is_active
    const { error } = await supabase.from('students').update({ is_active: newStatus }).eq('id', s.id)
    if (error) { toast.error('เปลี่ยนสถานะไม่สำเร็จ'); return }
    toast.success(newStatus ? 'เปิดใช้งานแล้ว' : 'ปิดใช้งานแล้ว')
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

  function exportExcel() {
    const data = filtered.map(s => {
      const activeEnroll = s.enrollments?.find(e => e.status === 'active')
      return {
        'ชื่อ-นามสกุล': s.full_name,
        'ชื่อเล่น': s.nickname ?? '',
        'วันเกิด': s.date_of_birth ?? '',
        'เพศ': s.gender === 'female' ? 'หญิง' : s.gender === 'male' ? 'ชาย' : 'อื่นๆ',
        'ผู้ปกครอง': s.parent_name ?? '',
        'เบอร์โทร': s.parent_phone ?? '',
        'LINE ID': s.parent_line_id ?? '',
        'คอร์สปัจจุบัน': (activeEnroll?.course as any)?.name ?? '',
        'ครั้งที่ใช้': activeEnroll?.lessons_used ?? '',
        'ครั้งทั้งหมด': activeEnroll?.lessons_total ?? '',
        'สถานะ': s.is_active ? 'Active' : 'Inactive',
        'หมายเหตุ': s.notes ?? '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'นักเรียน')
    XLSX.writeFile(wb, `students_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('ดาวน์โหลด Excel แล้ว')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">ข้อมูลนักเรียน</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} คน</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-outline">
            📥 Export Excel
          </button>
          <button onClick={() => { setEditStudent(null); setForm({ full_name: '', nickname: '', date_of_birth: '', gender: 'female', parent_name: '', parent_phone: '', parent_line_id: '', notes: '' }); setShowForm(true) }} className="btn-brand">
            + เพิ่มนักเรียน
          </button>
        </div>
      </div>

      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="ค้นหาชื่อ, ชื่อเล่น, ผู้ปกครอง..."
          v
