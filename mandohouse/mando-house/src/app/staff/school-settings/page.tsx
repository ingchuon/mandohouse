'use client'
// src/app/staff/school-settings/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type SchoolData = {
  name: string
  name_th: string
  logo_url: string
  receipt_subtitle: string
  receipt_address: string
  receipt_tel: string
  receipt_receiver: string
}

export default function SchoolSettingsPage() {
  const supabase = createClient()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [data, setData] = useState<SchoolData>({
    name: '', name_th: '', logo_url: '',
    receipt_subtitle: '', receipt_address: '', receipt_tel: '', receipt_receiver: '',
  })

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase
        .from('profiles').select('school_id').eq('id', user.id).single()
      if (!profile?.school_id) { setLoading(false); return }
      setSchoolId(profile.school_id)

      const { data: sc } = await supabase
        .from('schools')
        .select('name, name_th, logo_url, receipt_subtitle, receipt_address, receipt_tel, receipt_receiver')
        .eq('id', profile.school_id)
        .single()
      if (sc) {
        setData({
          name: sc.name ?? '',
          name_th: sc.name_th ?? '',
          logo_url: sc.logo_url ?? '',
          receipt_subtitle: sc.receipt_subtitle ?? '',
          receipt_address: sc.receipt_address ?? '',
          receipt_tel: sc.receipt_tel ?? '',
          receipt_receiver: sc.receipt_receiver ?? '',
        })
      }
      setLoading(false)
    })()
  }, [])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !schoolId) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ไฟล์ต้องไม่เกิน 2MB')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logos/${schoolId}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('tutorcloud-assets')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage
        .from('tutorcloud-assets')
        .getPublicUrl(path)

      setData(d => ({ ...d, logo_url: pub.publicUrl }))
      toast.success('อัปโหลดโลโก้แล้ว — อย่าลืมกดบันทึก')
    } catch (err: any) {
      toast.error('อัปโหลดไม่สำเร็จ: ' + (err.message ?? ''))
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!schoolId) return
    setSaving(true)
    try {
      const { error } = await supabase.rpc('update_own_school', {
        p_name_th: data.name_th || data.name,
        p_logo_url: data.logo_url,
        p_receipt_subtitle: data.receipt_subtitle,
        p_receipt_address: data.receipt_address,
        p_receipt_tel: data.receipt_tel,
        p_receipt_receiver: data.receipt_receiver,
      })
      if (error) throw error
      toast.success('บันทึกข้อมูลสถาบันแล้ว')
    } catch (err: any) {
      toast.error('บันทึกไม่สำเร็จ: ' + (err.message ?? ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">กำลังโหลด...</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">🏫 ตั้งค่าสถาบัน</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 mb-6">
        โลโก้และข้อมูลนี้จะแสดงในแถบเมนู, Dashboard และบนใบเสร็จรับเงิน
      </p>

      {/* โลโก้ */}
      <div className="bg-white dark:bg-[#242d3f] rounded-2xl border border-gray-100 dark:border-[#2a3245] p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">โลโก้สถาบัน</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#1e2533] flex-shrink-0">
            {data.logo_url
              ? <img src={data.logo_url} alt="logo" className="w-full h-full object-contain" />
              : <span className="text-gray-300 text-xs text-center px-1">ยังไม่มีโลโก้</span>
            }
          </div>
          <div>
            <label className="inline-block cursor-pointer text-sm px-4 py-2 rounded-lg text-white font-medium"
              style={{ background: '#1C3A2A' }}>
              {uploading ? 'กำลังอัปโหลด...' : '📤 เลือกรูปโลโก้'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
            </label>
            <p className="text-xs text-gray-400 mt-2">PNG หรือ JPG · ไม่เกิน 2MB · แนะนำสี่เหลี่ยมจัตุรัส</p>
          </div>
        </div>
      </div>

      {/* ข้อมูลทั่วไป */}
      <div className="bg-white dark:bg-[#242d3f] rounded-2xl border border-gray-100 dark:border-[#2a3245] p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">ข้อมูลทั่วไป</h2>
        <div className="space-y-3">
          <Field label="ชื่อสถาบัน" value={data.name_th}
            onChange={v => setData(d => ({ ...d, name_th: v }))}
            placeholder="เช่น สถาบัน ABC" />
          <Field label="คำโปรย (ใต้ชื่อในใบเสร็จ)" value={data.receipt_subtitle}
            onChange={v => setData(d => ({ ...d, receipt_subtitle: v }))}
            placeholder="เช่น สถาบันสอนพิเศษ คณิต วิทย์ อังกฤษ" />
        </div>
      </div>

      {/* ข้อมูลใบเสร็จ */}
      <div className="bg-white dark:bg-[#242d3f] rounded-2xl border border-gray-100 dark:border-[#2a3245] p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">ข้อมูลสำหรับใบเสร็จ</h2>
        <p className="text-xs text-gray-400 mb-3">แสดงในใบเสร็จ PDF เมื่อออกให้นักเรียน</p>
        <div className="space-y-3">
          <Field label="ที่อยู่" value={data.receipt_address}
            onChange={v => setData(d => ({ ...d, receipt_address: v }))}
            placeholder="ที่อยู่ : 123 ถ.xxx ต.xxx อ.xxx จ.xxx 10000" />
          <Field label="เบอร์โทร" value={data.receipt_tel}
            onChange={v => setData(d => ({ ...d, receipt_tel: v }))}
            placeholder="โทร : 08x-xxx-xxxx" />
          <Field label="ชื่อผู้รับเงิน" value={data.receipt_receiver}
            onChange={v => setData(d => ({ ...d, receipt_receiver: v }))}
            placeholder="ชื่อ-นามสกุล ผู้รับเงิน" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm"
        style={{ background: '#1C3A2A', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
      </button>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-[#1e2533] text-sm focus:outline-none focus:border-green-600"
      />
    </div>
  )
}
