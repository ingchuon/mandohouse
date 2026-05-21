'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }
    await new Promise(r => setTimeout(r, 500))
window.location.href = '/staff'
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 text-white text-2xl font-bold mb-4">
            曼
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Mando House</h1>
          <p className="text-sm text-gray-500 mt-1">ระบบบริหารจัดการสถาบันภาษาจีน</p>
        </div>
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="label">อีเมล</label>
            <input type="email" className="input" placeholder="teacher@mandohouse.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input type="password" className="input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading}
            className="btn-brand w-full justify-center py-2.5 text-base">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          ผู้ปกครองสามารถเข้าสู่ระบบด้วยอีเมลที่ครูลงทะเบียนให้
        </p>
      </div>
    </div>
  )
}
