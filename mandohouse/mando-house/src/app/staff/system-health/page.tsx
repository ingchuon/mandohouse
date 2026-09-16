'use client'

// วางไฟล์นี้ที่: src/app/staff/system-health/page.tsx
// เข้าที่ /staff/system-health (เฉพาะ Mando)

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Failure { check_name: string; object_name: string; status: string; detail: string }
interface AuditLog {
  id: number
  ran_at: string
  total_checks: number
  fail_count: number
  failures: Failure[]
}

export default function SystemHealthPage() {
  const supabase = createClient()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [result, setResult] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function init() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAuthorized(false); setLoading(false); return }
    const { data: profile } = await supabase
      .from('profiles').select('school_id').eq('id', user.id).single()
    const isMando = profile?.school_id === 'mando'
    setAuthorized(isMando)
    if (isMando) {
      const { data } = await supabase
        .from('isolation_audit_log')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) setResult(data as AuditLog)
    }
    setLoading(false)
  }

  async function runNow() {
    setChecking(true)
    const { data, error } = await supabase.rpc('run_isolation_audit')
    setChecking(false)
    if (error) { toast.error('ตรวจไม่สำเร็จ'); return }
    setResult(data as AuditLog)
    toast.success('ตรวจเสร็จแล้ว')
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short',
    })
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">กำลังโหลด...</div>
  if (authorized === false)
    return <div className="p-6 text-sm text-gray-500 dark:text-gray-400">หน้านี้สำหรับผู้ดูแลระบบ (Mando) เท่านั้น</div>

  const ok = result != null && result.fail_count === 0

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">สุขภาพระบบ — การแยกข้อมูลสถาบัน</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ตรวจว่าข้อมูลแต่ละสถาบันไม่ปนกัน (RLS / policy / school_id)</p>
        </div>
        <button onClick={runNow} disabled={checking}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium">
          {checking ? 'กำลังตรวจ...' : 'ตรวจเดี๋ยวนี้'}
        </button>
      </div>

      {!result ? (
        <p className="text-sm text-gray-400">ยังไม่มีผลตรวจ — กด “ตรวจเดี๋ยวนี้”</p>
      ) : (
        <>
          {/* สถานะไฟเขียว/แดง */}
          <div className={`rounded-xl border p-5 flex items-center gap-4 ${
            ok
              ? 'border-green-300 bg-green-50 dark:border-green-800/60 dark:bg-green-900/20'
              : 'border-red-300 bg-red-50 dark:border-red-800/60 dark:bg-red-900/20'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              ok ? 'bg-green-500' : 'bg-red-500'
            }`}>{ok ? '✓' : '!'}</div>
            <div>
              <div className={`text-lg font-bold ${ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {ok ? 'ปลอดภัย — ข้อมูลไม่ปนกัน' : `พบปัญหา ${result.fail_count} จุด`}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                ตรวจ {result.total_checks} รายการ · ผ่าน {result.total_checks - result.fail_count} · ล่าสุด {fmt(result.ran_at)}
              </div>
            </div>
          </div>

          {/* รายการที่ไม่ผ่าน */}
          {result.fail_count > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">ตาราง</th>
                    <th className="text-left px-3 py-2">เช็ค</th>
                    <th className="text-left px-3 py-2">รายละเอียด / วิธีแก้</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failures.map((f, i) => (
                    <tr key={i} className="border-t border-red-100 dark:border-red-900/40">
                      <td className="px-3 py-2 font-medium">{f.object_name}</td>
                      <td className="px-3 py-2 text-gray-500">{f.check_name}</td>
                      <td className="px-3 py-2">{f.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            ระบบตรวจอัตโนมัติทุกวัน 08:00 น. หากพบปัญหา หน้านี้จะขึ้นสถานะแดงพร้อมวิธีแก้
          </p>
        </>
      )}
    </div>
  )
}
