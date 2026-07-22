// src/app/staff/schedule/connect/page.tsx
// หน้าเชื่อมต่อ Google Calendar — ลูกค้าเพิ่ม account เองได้
'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type TokenRow = {
  account_tag: string
  email: string
  updated_at: string
}

function ConnectContent() {
  const params = useSearchParams()
  const success = params.get('success')
  const error   = params.get('error')
  const email   = params.get('email')

  const [accounts, setAccounts] = useState<TokenRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState('')

  // ดึงรายการ account ที่เชื่อมแล้ว
  useEffect(() => {
    fetch('/api/calendar/accounts')
      .then(r => r.json())
      .then(d => setAccounts(d.accounts ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false))
  }, [success])

  const startConnect = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'main'
    window.location.href = `/api/auth/google?account=${encodeURIComponent(clean)}`
  }

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-1">🗓 เชื่อมต่อ Google Calendar</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        เชื่อมต่อ Google Calendar เพื่อให้ตารางสอนแสดงคลาสอัตโนมัติ — เพิ่มได้หลายบัญชี (เช่น ครูแต่ละคน)
      </p>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
          ✅ เชื่อมต่อสำเร็จ: <strong>{email}</strong>
        </div>
      )}
      {error === 'google_denied' && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
          ❌ ยกเลิกการเชื่อมต่อ กรุณาลองใหม่
        </div>
      )}
      {error === 'no_refresh_token' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 text-sm">
          ⚠️ ไม่ได้รับสิทธิ์ครบ — ลองเชื่อมต่อใหม่อีกครั้ง ถ้ายังไม่ได้ให้ไปที่ myaccount.google.com/permissions ลบสิทธิ์เดิมออกก่อน
        </div>
      )}
      {error === 'no_school' && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
          ❌ ไม่พบข้อมูลสถาบัน กรุณา login ใหม่
        </div>
      )}

      {/* บัญชีที่เชื่อมแล้ว */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">บัญชีที่เชื่อมต่อแล้ว</h2>
        {loading ? (
          <div className="text-sm text-gray-400">กำลังโหลด...</div>
        ) : accounts.length === 0 ? (
          <div className="text-sm text-gray-400 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
            ยังไม่มีบัญชีที่เชื่อมต่อ
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.account_tag} className="card p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{acc.email}</div>
                  <div className="text-xs text-gray-400">ป้ายกำกับ: {acc.account_tag}</div>
                </div>
                <button
                  onClick={() => startConnect(acc.account_tag)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
                >
                  เชื่อมใหม่
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* เพิ่มบัญชีใหม่ */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">+ เพิ่มบัญชีใหม่</h2>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          ป้ายกำกับ (เช่น ชื่อครู หรือ main) — ภาษาอังกฤษ/ตัวเลข
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="เช่น teacher_a, main"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-[#1e2533] text-sm"
          />
          <button
            onClick={() => startConnect(newTag)}
            className="btn-brand text-sm flex-shrink-0"
            style={{ background: '#1C3A2A', color: '#fff' }}
          >
            🔗 เชื่อมต่อ
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          กด "เชื่อมต่อ" แล้ว login ด้วย Gmail ที่ใช้ Google Calendar → กด Allow — ทำครั้งเดียว ระบบจะจำไว้
        </p>
      </div>

      <a href="/staff/schedule" className="btn-outline mt-4 inline-block text-sm">
        ← กลับหน้าตารางสอน
      </a>
    </div>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">กำลังโหลด...</div>}>
      <ConnectContent />
    </Suspense>
  )
}
