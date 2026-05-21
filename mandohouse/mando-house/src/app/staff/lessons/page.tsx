'use client'
// src/app/staff/lessons/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export default function LessonsPage() {
  const supabase = createClient()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [logForm, setLogForm] = useState({ topic: '', homework: '', lesson_date: new Date().toISOString().split('T')[0] })

  async function loadData() {
    const { data } = await supabase
      .from('enrollments')
      .select('*, student:students(full_name, nickname), course:courses(name, total_lessons), teacher:profiles(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setEnrollments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function addLesson(e: any) {
    e.preventDefault()
    if (!adding) return
    const enrollment = enrollments.find(en => en.id === adding)
    if (!enrollment) return

    const { error } = await supabase.from('lesson_logs').insert({
      enrollment_id: adding,
      student_id: enrollment.student_id,
      lesson_number: enrollment.lessons_used + 1,
      lesson_date: logForm.lesson_date,
      topic: logForm.topic,
      homework: logForm.homework,
    })
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
    toast.success(`บันทึกครั้งที่ ${enrollment.lessons_used + 1} แล้ว`)
    setAdding(null)
    setLogForm({ topic: '', homework: '', lesson_date: new Date().toISOString().split('T')[0] })
    loadData()
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">นับครั้งการเรียน</h1>
      <p className="text-sm text-gray-500 mb-6">ติดตามและบันทึกครั้งการเรียนของแต่ละ enrollment</p>

      <div className="card overflow-hidden">
        {loading ? <p className="text-center text-gray-400 py-12">กำลังโหลด...</p> : (
          <table className="w-full">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>คอร์ส</th>
                <th>ครั้งที่เรียน</th>
                <th>เหลือ</th>
                <th>ความคืบหน้า</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(en => {
                const remaining = en.lessons_total - en.lessons_used
                const pct = Math.round((en.lessons_used / en.lessons_total) * 100)
                const name = en.student?.nickname || en.student?.full_name

                return (
                  <tr key={en.id} className="table-row-hover">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                          {(name || '?').slice(0, 2)}
                        </div>
                        <span className="font-medium text-sm">{name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600 text-sm">{en.course?.name}</td>
                    <td className="font-medium text-sm">
                      {en.lessons_used} / {en.lessons_total} ครั้ง
                    </td>
                    <td>
                      <span className={`font-semibold text-sm ${
                        remaining <= 2 ? 'text-red-600' : remaining <= 5 ? 'text-amber-600' : 'text-brand-600'
                      }`}>
                        {remaining} ครั้ง
                      </span>
                    </td>
                    <td>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 85 ? 'bg-red-400' : pct >= 65 ? 'bg-amber-400' : 'bg-brand-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{pct}%</div>
                    </td>
                    <td>
                      <button
                        onClick={() => setAdding(en.id)}
                        disabled={remaining <= 0}
                        className="btn-brand btn-sm"
                      >
                        + บันทึกครั้งเรียน
                      </button>
                    </td>
                  </tr>
                )
              })}
              {enrollments.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">ไม่มี enrollment ที่กำลังเรียน</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Lesson Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">บันทึกครั้งเรียน</h2>
              <button onClick={() => setAdding(null)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={addLesson} className="p-5 space-y-3">
              <div>
                <label className="label">วันที่เรียน</label>
                <input type="date" className="input" value={logForm.lesson_date}
                  onChange={e => setLogForm({...logForm, lesson_date: e.target.value})} />
              </div>
              <div>
                <label className="label">เนื้อหาที่เรียน</label>
                <input className="input" placeholder="เช่น สระจีน, พินอิน, บทที่ 3"
                  value={logForm.topic}
                  onChange={e => setLogForm({...logForm, topic: e.target.value})} />
              </div>
              <div>
                <label className="label">การบ้าน</label>
                <textarea className="input min-h-[70px] resize-none" placeholder="การบ้านที่ให้..."
                  value={logForm.homework}
                  onChange={e => setLogForm({...logForm, homework: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-brand flex-1 justify-center">บันทึก</button>
                <button type="button" onClick={() => setAdding(null)} className="btn-outline flex-1 justify-center">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
