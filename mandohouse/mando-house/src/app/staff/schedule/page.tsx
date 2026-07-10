'use client'
// src/app/staff/schedule/page.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'

type GCalEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  account: string
  email: string
  location: string
  meetLink: string
  cancelled: boolean
}

type AccountInfo = {
  account: string
  email: string
  ok: boolean
  count: number
}

const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

const ACCOUNT_META: Record<string, { label: string; color: string }> = {
  main: { label: 'ปฏิทินหลัก', color: '#3B9EE0' },
  aom: { label: 'ครูออม', color: '#F5A623' },
  nalin: { label: 'ครูบี', color: '#7C6FF7' },
}

function metaOf(tag: string) {
  return ACCOUNT_META[tag] ?? { label: tag, color: '#9CA3AF' }
}

/** วันอาทิตย์ของสัปดาห์ที่ date อยู่ (เวลา 00:00) */
function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function ymd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

function fmtThaiDate(date: Date) {
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  })
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [events, setEvents] = useState<GCalEvent[]>([])
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [hidden, setHidden] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState('')

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  const load = useCallback(async () => {
    setLoading(true)
    setErrMsg('')
    try {
      const params = new URLSearchParams({
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      })
      const res = await fetch(`/api/calendar/events?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) {
        setErrMsg(json?.error ?? 'โหลดข้อมูลไม่สำเร็จ')
        setEvents([])
        setAccounts([])
        return
      }
      setEvents(json.events ?? [])
      setAccounts(json.accounts ?? [])
    } catch {
      setErrMsg('เชื่อมต่อ API ไม่ได้')
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd])

  useEffect(() => {
    load()
  }, [load])

  const toggleAccount = (tag: string) => {
    setHidden((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const visibleEvents = events.filter((e) => !hidden.includes(e.account))

  // จัดกลุ่มตามวัน (คีย์ = YYYY-MM-DD)
  const byDay = useMemo(() => {
    const map: Record<string, GCalEvent[]> = {}
    for (const e of visibleEvents) {
      const key = e.allDay ? e.start.slice(0, 10) : ymd(new Date(e.start))
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [visibleEvents])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayKey = ymd(new Date())

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1a2030] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              ตารางสอน (Google Calendar)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fmtThaiDate(weekStart)} – {fmtThaiDate(addDays(weekStart, 6))}
              {' · '}
              <a
                href="/staff/schedule/connect"
                className="underline text-[#3B9EE0]"
              >
                เชื่อมต่อบัญชี
              </a>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#242d3f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-sm"
            >
              ← ก่อนหน้า
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#242d3f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-sm"
            >
              สัปดาห์นี้
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#242d3f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-sm"
            >
              ถัดไป →
            </button>
            <button
              onClick={load}
              className="px-3 py-2 rounded-lg bg-[#3B9EE0] text-white text-sm"
            >
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Legend / filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {accounts.map((a) => {
            const m = metaOf(a.account)
            const off = hidden.includes(a.account)
            return (
              <button
                key={a.account}
                onClick={() => toggleAccount(a.account)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm bg-white dark:bg-[#242d3f] border-gray-200 dark:border-gray-700"
                style={{ opacity: off ? 0.4 : 1 }}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: m.color }}
                />
                <span className="text-gray-700 dark:text-gray-200">
                  {m.label}
                </span>
                <span className="text-gray-400 text-xs">({a.count})</span>
                {!a.ok && (
                  <span className="text-red-500 text-xs">token เสีย</span>
                )}
              </button>
            )
          })}
        </div>

        {errMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm">
            {errMsg} —{' '}
            <a href="/staff/schedule/connect" className="underline">
              ไปหน้าเชื่อมต่อ Google
            </a>
          </div>
        )}

        {loading && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            กำลังโหลด...
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day, i) => {
              const key = ymd(day)
              const list = byDay[key] ?? []
              const isToday = key === todayKey
              return (
                <div
                  key={key}
                  className="rounded-xl bg-white dark:bg-[#242d3f] border border-gray-200 dark:border-gray-700 p-3 min-h-[140px]"
                  style={isToday ? { borderColor: '#3B9EE0' } : undefined}
                >
                  <div className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {DAYS[i]}
                    </div>
                    <div className="text-xs text-gray-400">
                      {fmtThaiDate(day)}
                    </div>
                  </div>

                  {list.length === 0 && (
                    <div className="text-xs text-gray-400 py-2">ไม่มีคลาส</div>
                  )}

                  <div className="space-y-2">
                    {list.map((e) => {
                      const m = metaOf(e.account)
                      return (
                        <div
                          key={e.id}
                          className="rounded-lg p-2 text-xs"
                          style={{
                            backgroundColor: `${m.color}1A`,
                            borderLeft: `3px solid ${m.color}`,
                            opacity: e.cancelled ? 0.5 : 1,
                          }}
                        >
                          <div
                            className="font-medium text-gray-800 dark:text-gray-100"
                            style={
                              e.cancelled
                                ? { textDecoration: 'line-through' }
                                : undefined
                            }
                          >
                            {e.title}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                            {e.allDay
                              ? 'ทั้งวัน'
                              : `${fmtTime(e.start)} - ${fmtTime(e.end)}`}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: m.color }}>
                            {m.label}
                          </div>
                          {e.meetLink && (
                            <a
                              href={e.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] underline text-blue-600 dark:text-blue-400"
                            >
                              เข้า Google Meet
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && visibleEvents.length === 0 && !errMsg && (
          <div className="text-center py-8 text-gray-400 text-sm">
            ไม่มี event ในสัปดาห์นี้
          </div>
        )}
      </div>
    </div>
  )
}
