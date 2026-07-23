// src/lib/plans.ts
// แหล่งข้อมูลราคาเดียวของทั้งระบบ — register, subscriptions, landing ควร import จากที่นี่
// เพื่อไม่ให้ราคาหลุดกันอีก (ห้าม hardcode ราคาซ้ำในไฟล์อื่น)

export type Plan = {
  id: string        // ค่าที่บันทึกลงคอลัมน์ schools.plan
  name: string      // ชื่อแสดงผลภาษาไทย
  months: number    // จำนวนเดือนของแพ็กเกจ
  total: number     // ราคาจ่ายครั้งเดียว (บาท)
  perMonth: number  // ราคาเฉลี่ยต่อเดือน (บาท) — ใช้คิด MRR
  save: number      // ประหยัดเทียบราคาปกติ (บาท)
  desc: string
  popular?: boolean
}

export const PLANS: Plan[] = [
  { id: '3m',  name: '3 เดือน', months: 3,  total: 2190, perMonth: 730, save: 180,  desc: 'เริ่มต้นใช้งานระยะสั้น' },
  { id: '6m',  name: '6 เดือน', months: 6,  total: 3990, perMonth: 665, save: 750,  desc: 'คุ้มค่าที่สุด', popular: true },
  { id: '12m', name: '1 ปี',    months: 12, total: 6990, perMonth: 583, save: 2490, desc: 'ประหยัดสูงสุด' },
]

export const PLAN_BY_ID: Record<string, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p])
)

// ค่ากลางของระบบ — แก้ที่นี่ที่เดียว
export const TRIAL_DAYS = 30
export const TRIAL_PLAN_ID = 'trial'
export const LINE_ID = '@tutorcloud'
export const LINE_URL = 'https://line.me/R/ti/p/@tutorcloud'

export function planName(id: string): string {
  if (id === TRIAL_PLAN_ID) return `ทดลองใช้ฟรี ${TRIAL_DAYS} วัน`
  return PLAN_BY_ID[id]?.name ?? id
}

export function isTrial(id: string): boolean {
  return id === TRIAL_PLAN_ID
}

export function planTotal(id: string): number {
  return PLAN_BY_ID[id]?.total ?? 0
}

export function planPerMonth(id: string): number {
  return PLAN_BY_ID[id]?.perMonth ?? 0
}

// จำนวนเดือนของแพ็กเกจ — ใช้คำนวณวันหมดอายุตอนอนุมัติ
// ถ้าไม่รู้จักแพ็กเกจ คืน 1 เดือน (ปลอดภัยไว้ก่อน ต่ออายุเพิ่มได้)
export function planMonths(id: string): number {
  return PLAN_BY_ID[id]?.months ?? 1
}
