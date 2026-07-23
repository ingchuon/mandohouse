'use client'
// src/app/join/page.tsx — ครู/เจ้าหน้าที่สมัครเข้าร่วมทีมด้วยรหัสเชิญ
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LINE_ID } from '@/lib/plans'

const C = {
  brown: '#A15C38',
  brownMid: '#e8d5cc',
  dark: '#262220',
  cream: '#F7F1F0',
}

function JoinForm() {
  const supabase = createClient()
  const params = useSearchParams()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '', fullName: '', phone: '', lineId: '',
    email: '', password: '', confirmPassword: '',
  })

  // รับรหัสจากลิงก์เชิญ /join?code=XXXXXXXX
  useEffect(() => {
    const c = params.get('code')
    if (c) setForm(f => ({ ...f, code: c.toUpperCase() }))
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('กรุณากรอกรหัสเชิญ'); return }
    if (form.password !== form.confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return }
    if (form.password.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            invite_code: form.code.trim().toUpperCase(),
            full_name: form.fullName,
            phone: form.phone.replace(/[-\s]/g, ''),
            line_id: form.lineId,
          },
        },
      })
      if (error) {
        if ((error.message || '').includes('invalid_invite_code')) {
          throw new Error('รหัสเชิญไม่ถูกต้อง หรือสถาบันหมดอายุแล้ว')
        }
        throw new Error(error.message)
      }
      setDone(true)
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.dark }}>
            Tutor<span style={{ color: C.brown }}>cloud</span>
          </span>
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.brownMid}`, padding: 28 }}>
        {!done ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 }}>เข้าร่วมทีม</h2>
              <p style={{ fontSize: 13, color: '#9a8a86' }}>ใช้รหัสเชิญที่ได้รับจากสถาบันของคุณ</p>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>รหัสเชิญ</label>
              <input className="tc-input" required placeholder="เช่น A1B2C3D4"
                style={{ letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}
                value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ชื่อ-นามสกุล</label>
              <input className="tc-input" required placeholder="เช่น ครูสมชาย ใจดี"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>เบอร์โทรศัพท์</label>
              <input className="tc-input" type="tel" placeholder="0XX-XXX-XXXX"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>
                LINE ID <span style={{ fontWeight: 400, color: '#b8a8a4' }}>(ไม่บังคับ)</span>
              </label>
              <input className="tc-input" placeholder="@somchai"
                value={form.lineId} onChange={e => setForm({ ...form, lineId: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>อีเมล</label>
              <input className="tc-input" type="email" required placeholder="teacher@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>รหัสผ่าน</label>
              <input className="tc-input" type="password" required placeholder="อย่างน้อย 8 ตัวอักษร"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ยืนยันรหัสผ่าน</label>
              <input className="tc-input" type="password" required placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
            </div>

            <button type="submit" disabled={loading} className="tc-btn" style={{ background: C.brown, color: '#fff' }}>
              {loading ? 'กำลังสร้างบัญชี...' : 'เข้าร่วมทีม'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8 }}>เข้าร่วมทีมสำเร็จ</h2>
            <p style={{ fontSize: 14, color: '#9a8a86', lineHeight: 1.8, marginBottom: 20 }}>
              เราส่งอีเมลยืนยันไปที่<br />
              <span style={{ color: C.brown, fontWeight: 600 }}>{form.email}</span><br />
              กดลิงก์ในอีเมลเพื่อยืนยัน แล้วเข้าสู่ระบบได้เลย
            </p>
            <p style={{ fontSize: 12, color: '#b8a8a4', marginBottom: 20 }}>
              ไม่พบอีเมล? ลองดูในโฟลเดอร์ Junk / Spam
            </p>
            <Link href="/login" className="tc-btn" style={{ display: 'block', background: C.brown, color: '#fff', textDecoration: 'none', textAlign: 'center' }}>
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#b8a8a4', marginTop: 14 }}>
        สอบถาม LINE <span style={{ color: C.brown, fontWeight: 600 }}>{LINE_ID}</span>
      </p>
    </div>
  )
}

export default function JoinPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'Sarabun', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .tc-input{width:100%;padding:10px 12px;border:1.5px solid ${C.brownMid};border-radius:6px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;background:#fff;color:${C.dark}}
        .tc-input:focus{border-color:${C.brown}}
        .tc-btn{width:100%;padding:12px;border-radius:7px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:opacity .15s}
        .tc-btn:hover:not(:disabled){opacity:.88}
        .tc-btn:disabled{opacity:.5;cursor:not-allowed}
      `}</style>
      <Suspense fallback={<div style={{ color: '#9a8a86' }}>กำลังโหลด...</div>}>
        <JoinForm />
      </Suspense>
    </div>
  )
}
