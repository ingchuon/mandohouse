'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Enrollment } from '@/types'
import toast from 'react-hot-toast'

export default function CheckinPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [todayCheckins, setTodayCheckins] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(new Date())
  const [editCheckin, setEditCheckin] = useState<any>(null)
  const [editForm, setEditForm] = useState({ check_in_at: '', check_out_at: '' })

  useEffect(() => {
    loadData()
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: s }, { data: e }, { data: c }] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('nickname'),
      supabase.from('enrollments').select('*, course:courses(name)').eq('status', 'active'),
      supabase.from('checkins')
        .select('*, student:students(full_name, nickname), enrollment:enrollments(*, course:courses(name))')
        .gte('check_in_at', today + 'T00:00:00')
        .order('check_in_at', { ascending: false }),
    ])
    setStudents(s ?? [])
    setEnrollments(e ?? [])
    setTodayCheckins(c ?? [])
  }

  async function handleCheckin() {
    if (!selectedStudent) { toast.error('กรุณาเลือกนักเรียน'); return }
    setLoading(true)
    const enrollment = enrollments.find(e => e.student_id === selectedStudent)
    const { error } = await supabase.from('checkins').insert({
      student_id: selectedStudent,
      enrollment_id: enrollment?.id,
      check_in_at: new Date().toISOString(),
    })
    if (error) { toast.error('เช็กอินไม่สำเร็จ'); setLoading(false); return }
    toast.success('เช็กอินสำเร็จ!')
    setSelectedStudent('')
    loadData()
    setLoading(false)
  }

  async function handleCheckout(checkinId: string) {
    const { error } = await supabase.from('checkins')
      .update({ check_out_at: new Date().toISOString() })
      .eq('id', checkinId)
    if (error) { toast.error('เช็กเอาท์ไม่สำเร็จ'); return }
    toast.success('เช็กเอาท์สำเร็จ!')
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    const { error } = await supabase.from('checkins').delete().eq('id', id)
    if (error) { toast.error('ลบไม่สำเร็จ'); return }
    toast.success('ลบแล้ว')
    loadData()
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
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('checkins').update({
      check_in_at: new Date(editForm.check_in_at).toISOString(),
      check_out_at: editForm.check_out_at ? new Date(editForm.check_out_at).toISOString() : null,
    }).eq('id', editCheckin.id)
    if (error) { toast.error('แก้ไขไม่สำเร็จ'); return }
    toast.success('แก้ไขแล้ว')
    setEditCheckin(null)
    loadData()
  }

  const fmt = (d: Date) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">เช็กอิน / เช็กเอาท์</h1>
      <p className="text-sm text-gray-500 mb-6">บันทึกเวลาเข้าออกของนักเรียน</p>

      <div className="grid grid-cols-3 gap-5">
        {/* Quick check-in panel */}
        <div className="card">
          <div className="card-header"><h3 className="font-medium">เช็กอินด่วน</h3></div>
          <div className="p-5 space-y-4">
            <div className="text-center bg-brand-50 rounded-xl p-4">
              <div className="text-3xl font-semibold text-brand-700">{fmt(now)}</div>
              <div className="text-xs text-brand-600 mt-1">เวลาปัจจุบัน</div>
            </div>
            <div>
              <label className="label">เลือกนักเรียน</label>
              <select className="input" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                <option value="">— เลือกนักเรียน —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.nickname || s.full_name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleCheckin} disabled={loading || !selectedStudent} className="btn-brand w-full justify-center py-2.5">
              {loading ? 'กำลังบันทึก...' : '✓ เช็กอิน'}
            </button>
          </div>
        </div>

        {/* Today's checkins */}
        <div className="col-span-2 card">
          <div className="card-header">
            <h3 className="font-medium">รายการวันนี้</h3>
            <span className="badge badge-green">{todayCheckins.length} คน</span>
          </div>
          <div className="divide-y divide-gray-50">
            {todayCheckins.length === 0 && (
              <p className="text-center text-gray-400 py-10 text-sm">ยังไม่มีการเช็กอินวันนี้</p>
            )}
            {todayCheckins.map(c => {
              const name = c.student?.nickname || c.student?.full_name || '?'
              const inTime = new Date(c.check_in_at)
              const outTime = c.check_out_at ? new Date(c.check_out_at) : null
              const duration = outTime ? Math.round((outTime.getTime() - inTime.getTime()) / 60000) : null

              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
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
                  <div className="flex gap-1 flex-shrink-0">
                    {!c.check_out_at && (
                      <button onClick={() => handleCheckout(c.id)} className="btn-outline btn-sm">เช็กเอาท์</button>
                    )}
                    {c.check_out_at && <span className="badge badge-gray">ออกแล้ว</span>}
                    <button onClick={() => openEdit(c)} className="btn-outline btn-sm px-2">✎</button>
                    <button onClick={() => handleDelete(c.id)} className="btn-outline btn-sm px-2 text-red-400 hover:bg-red-50">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
