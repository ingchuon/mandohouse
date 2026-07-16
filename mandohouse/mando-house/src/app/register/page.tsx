'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 490, desc: 'นักเรียนสูงสุด 50 คน' },
  { id: 'growth', name: 'Growth', price: 790, desc: 'นักเรียนสูงสุด 200 คน', popular: true },
  { id: 'pro', name: 'Pro', price: 1990, desc: 'ไม่จำกัดนักเรียน' },
]

const C = {
  brown: '#A15C38',
  brownLight: '#f5ede9',
  brownMid: '#e8d5cc',
  dark: '#262220',
  cream: '#F7F1F0',
  rose: '#C3A6A0',
}

type Step = 'info' | 'plan' | 'payment' | 'done'

export default function RegisterPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
  })
  const [selectedPlan, setSelectedPlan] = useState('growth')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)

  const plan = PLANS.find(p => p.id === selectedPlan)!

  function handleSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSlipFile(file)
    const reader = new FileReader()
    reader.onload = ev => setSlipPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleInfo(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน')
      return
    }
    if (form.password.length < 8) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    setStep('plan')
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!slipFile) {
      toast.error('กรุณาแนบสลิปการโอนเงิน')
      return
    }
    setLoading(true)
    try {
      // 1. สร้าง user ใน Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw new Error(authError.message)

      const userId = authData.user?.id
      if (!userId) throw new Error('ไม่สามารถสร้างบัญชีได้')

      // 2. upload สลิป
      const slipPath = `slips/${userId}_${Date.now()}.${slipFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(slipPath, slipFile)
      if (uploadError) throw new Error('อัปโหลดสลิปไม่สำเร็จ')

      // 3. บันทึกข้อมูลสถาบันใน table schools (status = pending)
      const { error: schoolError } = await supabase
        .from('schools')
        .insert({
          id: form.schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          name: form.schoolName,
          plan: selectedPlan,
          status: 'pending',
          owner_id: userId,
          slip_path: slipPath,
          created_at: new Date().toISOString(),
        })
      if (schoolError) throw new Error('บันทึกข้อมูลสถาบันไม่สำเร็จ')

      // 4. บันทึก profile
      await supabase.from('profiles').insert({
        id: userId,
        email: form.email,
        school_id: form.schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        role: 'admin',
        full_name: form.schoolName,
      })

      setStep('done')
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
        input{width:100%;padding:10px 12px;border:1.5px solid ${C.brownMid};border-radius:6px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;background:#fff;color:${C.dark}}
        input:focus{border-color:${C.brown}}
        .btn{width:100%;padding:12px;border-radius:7px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:opacity .15s}
        .btn:hover{opacity:.88}
        .btn:disabled{opacity:.5;cursor:not-allowed}
      `}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.dark }}>
            Tutor<span style={{ color: C.brown }}>cloud</span>
          </span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#fff', borderRadius: 10, border: `1px solid ${C.brownMid}`, overflow: 'hidden' }}>
          {[
            { key: 'info', label: 'ข้อมูล' },
            { key: 'plan', label: 'แพ็กเกจ' },
            { key: 'payment', label: 'ชำระเงิน' },
          ].map((s, i) => {
            const steps: Step[] = ['info', 'plan', 'payment', 'done']
            const current = steps.indexOf(step)
            const idx = steps.indexOf(s.key as Step)
            const done = current > idx
            const active = current === idx
            return (
              <div key={s.key} style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: active ? C.brown : done ? C.brownLight : '#fff', borderRight: i < 2 ? `1px solid ${C.brownMid}` : 'none', transition: 'background .2s' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? '#fff' : done ? C.brown : '#b8a8a4' }}>
                  {done ? '✓ ' : `${i + 1}. `}{s.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.brownMid}`, padding: 28 }}>

          {/* STEP 1 — ข้อมูล */}
          {step === 'info' && (
            <form onSubmit={handleInfo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 }}>สร้างบัญชีใหม่</h2>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ชื่อสถาบัน</label>
                <input required placeholder="เช่น Mando Language School" value={form.schoolName} onChange={e => setForm({ ...form, schoolName: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>อีเมล</label>
                <input type="email" required placeholder="admin@yourschool.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>รหัสผ่าน</label>
                <input type="password" required placeholder="อย่างน้อย 8 ตัวอักษร" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ยืนยันรหัสผ่าน</label>
                <input type="password" required placeholder="พิมพ์รหัสผ่านอีกครั้ง" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
              <button type="submit" className="btn" style={{ background: C.brown, color: '#fff', marginTop: 4 }}>
                ถัดไป — เลือกแพ็กเกจ
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#b8a8a4' }}>
                มีบัญชีแล้ว?{' '}
                <Link href="/login" style={{ color: C.brown, fontWeight: 600 }}>เข้าสู่ระบบ</Link>
              </p>
            </form>
          )}

          {/* STEP 2 — แพ็กเกจ */}
          {step === 'plan' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 16 }}>เลือกแพ็กเกจ</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                    style={{ border: `2px solid ${selectedPlan === p.id ? C.brown : C.brownMid}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', background: selectedPlan === p.id ? C.brownLight : '#fff', transition: 'all .15s', position: 'relative' }}>
                    {p.popular && (
                      <span style={{ position: 'absolute', top: -10, right: 12, background: C.brown, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>ยอดนิยม</span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#9a8a86', marginTop: 2 }}>{p.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: C.brown }}>฿{p.price.toLocaleString()}</span>
                        <span style={{ fontSize: 11, color: '#b8a8a4' }}>/เดือน</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('info')} className="btn" style={{ background: C.cream, color: C.dark, border: `1px solid ${C.brownMid}` }}>ย้อนกลับ</button>
                <button onClick={() => setStep('payment')} className="btn" style={{ background: C.brown, color: '#fff' }}>
                  ถัดไป — ชำระเงิน
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — ชำระเงิน */}
          {step === 'payment' && (
            <form onSubmit={handlePayment}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 }}>ชำระเงิน</h2>
              <p style={{ fontSize: 13, color: '#9a8a86', marginBottom: 20 }}>
                แพ็กเกจ <strong style={{ color: C.brown }}>{plan.name}</strong> — ฿{plan.price.toLocaleString()}/เดือน
              </p>

              {/* QR PromptPay */}
              <div style={{ background: C.brownLight, borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 12 }}>สแกน QR PromptPay</div>
                {/* QR placeholder — ใส่รูป QR จริงแทน */}
                <div style={{ width: 160, height: 160, background: '#fff', borderRadius: 8, margin: '0 auto 12px', border: `1px solid ${C.brownMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <rect x="4" y="4" width="30" height="30" rx="4" stroke={C.brown} strokeWidth="3" fill="none"/>
                        <rect x="12" y="12" width="14" height="14" rx="2" fill={C.brown}/>
                        <rect x="46" y="4" width="30" height="30" rx="4" stroke={C.brown} strokeWidth="3" fill="none"/>
                        <rect x="54" y="12" width="14" height="14" rx="2" fill={C.brown}/>
                        <rect x="4" y="46" width="30" height="30" rx="4" stroke={C.brown} strokeWidth="3" fill="none"/>
                        <rect x="12" y="54" width="14" height="14" rx="2" fill={C.brown}/>
                        <rect x="46" y="46" width="6" height="6" rx="1" fill={C.brown}/>
                        <rect x="56" y="46" width="6" height="6" rx="1" fill={C.brown}/>
                        <rect x="66" y="46" width="8" height="6" rx="1" fill={C.brown}/>
                        <rect x="46" y="56" width="6" height="6" rx="1" fill={C.brown}/>
                        <rect x="56" y="60" width="18" height="6" rx="1" fill={C.brown}/>
                        <rect x="46" y="66" width="6" height="8" rx="1" fill={C.brown}/>
                      </svg>
                    </div>
                    <div style={{ fontSize: 10, color: '#9a8a86' }}>ใส่รูป QR จริงตรงนี้</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.dark, fontWeight: 600 }}>063-359-5978</div>
                <div style={{ fontSize: 12, color: '#9a8a86', marginTop: 4 }}>TutorCloud</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.brown, marginTop: 8 }}>฿{plan.price.toLocaleString()}</div>
              </div>

              {/* แนบสลิป */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 8 }}>แนบสลิปการโอนเงิน</label>
                <label style={{ display: 'block', border: `2px dashed ${slipFile ? C.brown : C.brownMid}`, borderRadius: 8, padding: '16px', textAlign: 'center', cursor: 'pointer', background: slipFile ? C.brownLight : '#fafafa', transition: 'all .15s' }}>
                  {slipPreview ? (
                    <img src={slipPreview} alt="slip" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, margin: '0 auto', display: 'block' }} />
                  ) : (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                          <path d="M16 4v16M8 12l8-8 8 8" stroke={C.rose} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 24v2a2 2 0 002 2h20a2 2 0 002-2v-2" stroke={C.rose} strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div style={{ fontSize: 13, color: '#9a8a86' }}>กดเพื่ออัปโหลดสลิป</div>
                      <div style={{ fontSize: 11, color: '#b8a8a4', marginTop: 4 }}>PNG, JPG ขนาดไม่เกิน 5MB</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleSlip} style={{ display: 'none' }} />
                </label>
                {slipFile && (
                  <button type="button" onClick={() => { setSlipFile(null); setSlipPreview(null) }}
                    style={{ fontSize: 12, color: '#9a8a86', marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    เปลี่ยนสลิป
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep('plan')} className="btn" style={{ background: C.cream, color: C.dark, border: `1px solid ${C.brownMid}` }}>ย้อนกลับ</button>
                <button type="submit" disabled={loading || !slipFile} className="btn" style={{ background: C.brown, color: '#fff' }}>
                  {loading ? 'กำลังดำเนินการ...' : 'ยืนยันการสมัคร'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4 — เสร็จแล้ว */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.brownLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4 13l6 6L22 5" stroke={C.brown} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8 }}>สมัครสำเร็จ</h2>
              <p style={{ fontSize: 14, color: '#9a8a86', lineHeight: 1.75, marginBottom: 24 }}>
                ทีมงานกำลังตรวจสอบสลิปของคุณ<br />
                ระบบจะเปิดใช้งานภายใน 24 ชั่วโมง<br />
                <span style={{ fontSize: 13, color: C.brown, fontWeight: 500 }}>อีเมลยืนยันจะถูกส่งไปที่ {form.email}</span>
              </p>
              <Link href="/login" style={{ display: 'inline-block', background: C.brown, color: '#fff', padding: '11px 32px', borderRadius: 7, fontSize: 14, fontWeight: 600 }}>
                ไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#b8a8a4', marginTop: 20 }}>
          TutorCloud · ระบบจัดการสถาบันสอนพิเศษ
        </p>
      </div>
    </div>
  )
}
