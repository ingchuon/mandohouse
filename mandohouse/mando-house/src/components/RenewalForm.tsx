'use client'
// src/components/RenewalForm.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { PLANS } from '@/lib/plans'

const C = {
  green: '#1C3A2A',
  text: '#2C2C2C',
  textMid: '#6B6B6B',
  border: '#E2D9CC',
}

export default function RenewalForm({ schoolId }: { schoolId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [planId, setPlanId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์ต้องไม่เกิน 5MB')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!schoolId) { toast.error('ไม่พบข้อมูลสถาบัน'); return }
    if (!planId) { toast.error('เลือกแพ็กเกจก่อน'); return }
    if (!file) { toast.error('แนบรูปสลิปก่อน'); return }

    setSubmitting(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `renewals/${schoolId}_${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('payment-slips')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { error: rpcErr } = await supabase.rpc('submit_renewal', {
        p_plan_id: planId,
        p_slip_path: path,
      })
      if (rpcErr) throw rpcErr

      toast.success('ส่งสลิปแล้ว — ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 24 ชม.')
      router.refresh()
    } catch (err: any) {
      toast.error('ส่งไม่สำเร็จ: ' + (err.message ?? ''))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: '26px 24px', marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4, textAlign: 'center' }}>
        ต่ออายุด้วยตัวเอง
      </h2>
      <p style={{ fontSize: 13, color: C.textMid, textAlign: 'center', marginBottom: 18 }}>
        เลือกแพ็กเกจ โอนเงิน แล้วแนบสลิป — ทีมงานตรวจสอบและเปิดใช้งานให้ภายใน 24 ชม.
      </p>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>1. เลือกแพ็กเกจ</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        {PLANS.map(p => (
          <button key={p.id} type="button" onClick={() => setPlanId(p.id)}
            style={{
              padding: '14px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              border: `1.5px solid ${planId === p.id ? C.green : C.border}`,
              background: planId === p.id ? C.green : '#fff',
              color: planId === p.id ? '#fff' : C.text,
              transition: 'all .15s',
            }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>฿{p.total.toLocaleString()}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>2. แนบสลิปการโอนเงิน</div>
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `1.5px dashed ${C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', marginBottom: 20,
      }}>
        {preview ? (
          <img src={preview} alt="slip preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
        ) : (
          <>
            <span style={{ fontSize: 24, marginBottom: 6 }}>📎</span>
            <span style={{ fontSize: 13, color: C.textMid }}>แตะเพื่อเลือกรูปสลิป</span>
          </>
        )}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </label>

      <button type="button" onClick={handleSubmit} disabled={submitting || !planId || !file}
        style={{
          width: '100%', padding: 13, borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 600,
          background: C.green, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          opacity: (submitting || !planId || !file) ? 0.5 : 1,
        }}>
        {submitting ? 'กำลังส่ง...' : 'ส่งสลิปเพื่อต่ออายุ'}
      </button>
    </div>
  )
}
