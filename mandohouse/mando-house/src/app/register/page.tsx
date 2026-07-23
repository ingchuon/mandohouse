'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { TRIAL_DAYS, LINE_ID } from '@/lib/plans'

const C = {
  brown: '#A15C38',
  brownLight: '#f5ede9',
  brownMid: '#e8d5cc',
  dark: '#262220',
  cream: '#F7F1F0',
}

export default function RegisterPage() {
  const supabase = createClient()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', schoolName: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return }
    if (form.password.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return }

    setLoading(true)
    try {
      const schoolId =
        form.schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
        '-' + Date.now()

      // ส่งชื่อ/รหัสสถาบันไปกับบัญชี — ฐานข้อมูลจะสร้างสถาบันและโปรไฟล์ให้อัตโนมัติ
      // (ทดลองใช้ฟรี เปิดใช้งานทันที ไม่ต้องชำระเงิน)
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { school_id: schoolId, school_name: form.schoolName } },
      })
      if (error) throw new Error(error.message)

      setDone(true)
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

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
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
                  เริ่มใช้ฟรี {TRIAL_DAYS} วัน
                </h2>
                <p style={{ fontSize: 13, color: '#9a8a86' }}>
                  ไม่ต้องชำระเงิน ใช้งานได้ทุกฟีเจอร์ทันที
                </p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ชื่อสถาบัน</label>
                <input className="tc-input" required placeholder="เช่น Mando Language School"
                  value={form.schoolName} onChange={e => setForm({ ...form, schoolName: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>อีเมล</label>
                <input className="tc-input" type="email" required placeholder="admin@yourschool.com"
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
                {loading ? 'กำลังสร้างบัญชี...' : `เริ่มใช้ฟรี ${TRIAL_DAYS} วัน`}
              </button>

              <p style={{ fontSize: 12, color: '#9a8a86', textAlign: 'center', lineHeight: 1.7 }}>
                ครบ {TRIAL_DAYS} วันแล้วเลือกแพ็กเกจเพื่อใช้งานต่อ<br />
                ข้อมูลของคุณจะยังอยู่ครบ
              </p>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.brownLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M4 13l6 6L22 5" stroke={C.brown} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8 }}>สร้างบัญชีสำเร็จ</h2>
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

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9a8a86', marginTop: 18 }}>
          มีบัญชีแล้ว? <Link href="/login" style={{ color: C.brown, fontWeight: 600 }}>เข้าสู่ระบบ</Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#b8a8a4', marginTop: 8 }}>
          สอบถาม LINE <span style={{ color: C.brown, fontWeight: 600 }}>{LINE_ID}</span>
        </p>
      </div>
    </div>
  )
}
