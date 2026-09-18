'use client'

// วางไฟล์นี้ที่: src/app/staff/student-groups/page.tsx
// เข้าที่ /staff/student-groups

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Student { id: string; name: string; group_code: string | null }

export default function StudentGroupsPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [code, setCode] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: studs }, { data: enrs }] = await Promise.all([
      supabase.from('students').select('id, nickname, full_name').eq('is_active', true).order('nickname'),
      supabase.from('enrollments').select('student_id, group_code').not('group_code', 'is', null),
    ])
    const codeMap = new Map<string, string>()
    ;(enrs ?? []).forEach((e: any) => { if (e.group_code) codeMap.set(e.student_id, e.group_code) })
    setStudents((studs ?? []).map((s: any) => ({
      id: s.id,
      name: s.nickname || s.full_name || '(ไม่ระบุ)',
      group_code: codeMap.get(s.id) ?? null,
    })))
    setLoading(false)
  }

  const groups = useMemo(() => {
    const m: Record<string, Student[]> = {}
    students.forEach(s => { if (s.group_code) (m[s.group_code] ||= []).push(s) })
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))
  }, [students])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? students.filter(s => s.name.toLowerCase().includes(q)) : students
  }, [students, search])

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  async function assign() {
    const c = code.trim()
    if (!c) { toast.error('ใส่ชื่อ/รหัสกลุ่มก่อน'); return }
    if (selected.size < 2) { toast.error('เลือกอย่างน้อย 2 คน'); return }
    setSaving(true)
    const { error } = await supabase.from('enrollments')
      .update({ group_code: c }).in('student_id', Array.from(selected))
    setSaving(false)
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return }
    toast.success(`บันทึกกลุ่ม "${c}" แล้ว`)
    setCode(''); setSelected(new Set()); load()
  }

  async function removeStudent(s: Student) {
    const { error } = await supabase.from('enrollments')
      .update({ group_code: null }).eq('student_id', s.id)
    if (error) { toast.error('เอาออกไม่สำเร็จ'); return }
    toast.success(`เอา ${s.name} ออกจากกลุ่มแล้ว`)
    load()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">จัดกลุ่มเรียน</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        นักเรียนที่อยู่กลุ่มเดียวกัน (เรียนพร้อมกันจริง) จะถูกคิดค่าสอนแบบกลุ่ม (+ค่าคนเกิน) ในรายงานค่าสอนครู · คนที่ไม่อยู่กลุ่ม = คิดเดี่ยว
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      ) : (
        <>
          {/* กลุ่มปัจจุบัน */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">กลุ่มปัจจุบัน ({groups.length})</h2>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400">ยังไม่มีกลุ่ม</p>
            ) : (
              <div className="space-y-2">
                {groups.map(([gcode, members]) => (
                  <div key={gcode} className="rounded-xl border border-gray-200 dark:border-[#2a3245] bg-white dark:bg-gray-900 px-4 py-3">
                    <div className="text-xs text-gray-400 mb-1.5">{gcode}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {members.map(m => (
                        <span key={m.id} className="inline-flex items-center gap-1 bg-brand-50 dark:bg-[#2a3245] text-gray-700 dark:text-gray-200 text-sm rounded-full pl-3 pr-1.5 py-1">
                          {m.name}
                          <button onClick={() => removeStudent(m)}
                            className="w-5 h-5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-600 flex items-center justify-center text-xs">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* สร้าง/เพิ่มกลุ่ม */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a3245] bg-white dark:bg-gray-900 p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">สร้างกลุ่ม / เพิ่มคนเข้ากลุ่ม</h2>

            <label className="label">ชื่อ/รหัสกลุ่ม</label>
            <input className="input mb-3" placeholder='เช่น "มะลิ+ปุณ" (พิมพ์รหัสเดิมเพื่อเพิ่มคนเข้ากลุ่มที่มีอยู่)'
              value={code} onChange={e => setCode(e.target.value)} />

            <label className="label">เลือกนักเรียน (อย่างน้อย 2 คน)</label>
            <input className="input mb-2" placeholder="ค้นหาชื่อ..." value={search} onChange={e => setSearch(e.target.value)} />

            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-[#2a3245] divide-y divide-gray-100 dark:divide-[#232838]">
              {filtered.map(s => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#232838]">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}
                    className="w-4 h-4 accent-brand-600" />
                  <span className="text-sm text-gray-800 dark:text-gray-100">{s.name}</span>
                  {s.group_code && <span className="text-xs text-gray-400">· อยู่กลุ่ม {s.group_code}</span>}
                </label>
              ))}
              {filtered.length === 0 && <p className="text-sm text-gray-400 px-3 py-3">ไม่พบนักเรียน</p>}
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">เลือกแล้ว {selected.size} คน</span>
              <button onClick={assign} disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium">
                {saving ? 'กำลังบันทึก...' : 'บันทึกกลุ่ม'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
