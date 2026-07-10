'use client'
// src/components/CalendarCard.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type GCalEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  account: string
  cancelled: boolean
}

const DAYS_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// สีประจำ account
const ACCOUNT_COLOR: Record<string, string> = {
  main: '#3B9EE0',
  aom:  '#F5A623',
  nalin:'#7C6FF7',
}

const ACCOUNT_LABEL: Record<string, string> = {
  main:  'ปฏิทินหลัก',
  aom:   'ครูออม',
  nalin: 'ครูบี',
}

/* ---- helpers ---- */
function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0,0,0,0); return x
}
function startOfMondayWeek(d: Date) {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day  // Monday first
  x.setDate(x.getDate() + diff)
  return x
}
function startOfMonth(d: Date) {
  const x = startOfDay(d); x.setDate(1); return x
}
function addDays(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}
function addMonths(d: Date, n: number) {
  const x = new Date(d); x.setDate(1); x.setMonth(x.getMonth() + n); return x
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const STREAK_COLORS = ['#F87171','#FB923C','#FBBF24','#A3E635','#34D399','#60A5FA','#C084FC']

export default function CalendarCard() {
  const router = useRouter()
  const [cursor,   setCursor]   = useState<Date>(() => startOfDay(new Date()))
  const [events,   setEvents]   = useState<GCalEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [failed,   setFailed]   = useState(false)

  const gridStart = useMemo(() => startOfMondayWeek(startOfMonth(cursor)), [cursor])

  const load = useCallback(async () => {
    setLoading(true); setFailed(false)
    try {
      const p = new URLSearchParams({
        from: gridStart.toISOString(),
        to: addDays(gridStart, 42).toISOString(),
      })
      const res = await fetch(`/api/calendar/events?${p}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setFailed(true); setEvents([]); return }
      setEvents(json.events ?? [])
    } catch { setFailed(true) }
    finally   { setLoading(false) }
  }, [gridStart])

  useEffect(() => { load() }, [load])

  const todayKey = ymd(new Date())

  const byDay = useMemo(() => {
    const map: Record<string, GCalEvent[]> = {}
    for (const e of events) {
      if (e.cancelled) continue
      const key = e.allDay ? e.start.slice(0,10) : ymd(new Date(e.start))
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [events])

  // Today's sessions sorted by time
  const todaySessions = useMemo(() =>
    [...(byDay[todayKey] ?? [])].sort((a,b) => a.start.localeCompare(b.start))
  , [byDay, todayKey])

  // Streak — count consecutive days backwards that had at least 1 event
  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    while (count < 14) {
      const k = ymd(d)
      if (!(byDay[k]?.length)) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [byDay])

  const monthLabel = cursor.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  const monthEn    = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goDay = (day: Date) =>
    router.push(`/staff/schedule?view=day&date=${ymd(day)}`)

  return (
    <div className="rounded-2xl bg-white dark:bg-[#242d3f] border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-3">

      {/* ── Month header ── */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {monthEn}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(addMonths(cursor,-1))}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
          >‹</button>
          <button
            onClick={() => setCursor(startOfDay(new Date()))}
            className="px-2 h-6 rounded-md text-[10px] text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >Today</button>
          <button
            onClick={() => setCursor(addMonths(cursor,1))}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
          >›</button>
        </div>
      </div>

      {/* ── Weekday headers (Mon first) ── */}
      <div className="grid grid-cols-7">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 font-medium pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Date grid ── */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({length:42}, (_,i) => addDays(gridStart,i)).map(day => {
          const key       = ymd(day)
          const list      = byDay[key] ?? []
          const inMonth   = day.getMonth() === cursor.getMonth()
          const isToday   = key === todayKey
          const accounts  = [...new Set(list.map(e => e.account))].slice(0,3)

          return (
            <button
              key={key}
              onClick={() => goDay(day)}
              className="flex flex-col items-center py-0.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
              style={{ opacity: inMonth ? 1 : 0.25 }}
            >
              <span
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium"
                style={
                  isToday
                    ? { backgroundColor: '#1a1a2e', color: '#ffffff' }
                    : { color: 'inherit' }
                }
              >
                {day.getDate()}
              </span>

              {/* dot row */}
              <span className="flex gap-0.5 h-1.5 mt-0.5">
                {accounts.map(tag => (
                  <span
                    key={tag}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ACCOUNT_COLOR[tag] ?? '#9CA3AF' }}
                  />
                ))}
                {list.length === 0 && <span className="w-1.5 h-1.5" />}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Streak bar ── */}
      {!loading && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm">🔥</span>
          <div className="flex gap-1 flex-1">
            {Array.from({length:14}, (_,i) => {
              const d   = addDays(new Date(), -(13-i))
              const key = ymd(d)
              const has = (byDay[key]?.length ?? 0) > 0
              const color = STREAK_COLORS[i % STREAK_COLORS.length]
              return (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: has ? color : '#E5E7EB' }}
                />
              )
            })}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-gray-400">
              Streak&nbsp;
              <span className="font-semibold text-gray-700 dark:text-gray-200">{streak}</span>
              &nbsp;วัน&nbsp;&nbsp;เดือนนี้&nbsp;
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {(byDay[ymd(new Date())] ?? []).length}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── Today's sessions ── */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            TODAY&apos;S SESSIONS
          </span>
          <span className="text-[10px] text-[#3B9EE0] cursor-pointer"
                onClick={() => goDay(new Date())}>
            ดูทั้งหมด →
          </span>
        </div>

        {loading && (
          <div className="text-xs text-gray-400 py-2 text-center">กำลังโหลด...</div>
        )}
        {failed && (
          <div className="text-xs text-red-400 py-1">
            โหลดไม่สำเร็จ —{' '}
            <a href="/staff/schedule/connect" className="underline">เชื่อมต่อ Google</a>
          </div>
        )}
        {!loading && !failed && todaySessions.length === 0 && (
          <div className="text-xs text-gray-400 py-2 text-center">ไม่มีคลาสวันนี้</div>
        )}

        <div className="space-y-2">
          {todaySessions.slice(0,4).map(e => {
            const color = ACCOUNT_COLOR[e.account] ?? '#9CA3AF'
            const label = ACCOUNT_LABEL[e.account] ?? e.account
            return (
              <div key={e.id} className="flex items-start gap-2">
                {/* color bar */}
                <div
                  className="w-1 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: color, minHeight: '32px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                      {e.title}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {e.allDay ? 'ทั้งวัน' : `${fmtTime(e.start)} – ${fmtTime(e.end)}`}
                  </div>
                </div>
              </div>
            )
          })}

          {todaySessions.length > 4 && (
            <button
              onClick={() => goDay(new Date())}
              className="w-full text-xs text-[#3B9EE0] hover:underline text-center py-1"
            >
              +{todaySessions.length - 4} คลาสอื่น
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
