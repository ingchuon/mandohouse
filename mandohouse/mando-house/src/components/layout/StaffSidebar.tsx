'use client'
// src/components/layout/StaffSidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const navItems = [
  {
    group: 'ภาพรวม',
    items: [
      { href: '/staff', label: 'Dashboard', icon: '⊞' },
    ],
  },
  {
    group: 'นักเรียน',
    items: [
      { href: '/staff/students',  label: 'ข้อมูลนักเรียน',      icon: '👥' },
      { href: '/staff/checkin',   label: 'เช็กอิน / เช็กเอาท์', icon: '🕐' },
      { href: '/staff/lessons',   label: 'นับครั้งการเรียน',     icon: '📅' },
    ],
  },
  {
    group: 'การสอน',
    items: [
      { href: '/staff/schedule', label: 'ตารางสอน',     icon: '🗓' },
      { href: '/staff/reviews',  label: 'รีวิวหลังสอน', icon: '⭐' },
      { href: '/staff/courses',  label: 'คอร์สและราคา', icon: '📚' },
    ],
  },
  {
    group: 'การแจ้งเตือน',
    items: [
      { href: '/staff/alerts', label: 'แจ้งเตือน LINE', icon: '🔔' },
    ],
  },
  {
    group: 'การเงิน',
    items: [
      { href: '/staff/receipts', label: 'ออกใบเสร็จ',  icon: '🧾' },
      { href: '/staff/expenses', label: 'รายจ่าย',      icon: '📤' },
      { href: '/staff/books',    label: 'ขายหนังสือ',   icon: '📖' },
    ],
  },
  {
    group: 'ทีมงาน',
    items: [
      { href: '/staff/team', label: 'จัดการทีม', icon: '🎓' },
    ],
  },
]

export default function StaffSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [alertCount, setAlertCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supa
