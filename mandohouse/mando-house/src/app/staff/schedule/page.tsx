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

type ViewMode = 'day' | 'week' | 'month'

const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

const ACCOUNT_META: Record<string, { label: string; color: string }> = {
  main:  { label: 'ครูในสถาบัน', color: '#4ADE80' },
  aom:   { label: 'ครูออม',      color: '#FBBF24' },
  nalin: { label: 'ครูบี',       color: '#A78BFA' },
}

// Dark theme palette
const C = {
  bg:         '#0F1117',
  surface:    '#1A1D27',
  surface2:   '#22263A',
  border:     '#2E3347',
  borderHi:   '#4ADE80',
  text:       '#F1F5F9',
  textMuted:  '#94A3B8',
  textDim:    '#64748B',
  green:      '#4ADE80',
  greenDim:   '#1C3A2A',
  gold:       '#FBBF24',
  red:        '#F87171',
  todayBg:    '#1C3A2A',
  todayBorder:'#4ADE80',
}

function metaOf(tag: string) {
  return ACCOUNT_META[tag] ?? { label: tag, color: '#94A3B8' }
}

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}

function startOfDay(date: Date) {
  const d = new Date(date); d.setHours(0,0,0,0); return d
}
function startOfWeek(date: Date) {
  const d = startOfDay(date); d.setDate(d.getDate() - d.getDay()); return d
}
function startOfMonth(date: Date) {
  const d = startOfDay(date); d.setDate(1); return d
}
function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function addMonths(date: Date, n: number) {
  const d = new Date(date); d.setDate(1); d.setMonth(d.getMonth() + n); return d
}
function ymd(date: Date) {
  return date.getFullYear() + '-' +
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0')
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
}
function fmtThaiDate(date: Date) {
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}
function fmtThaiMonth(date: Date) {
  return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}
function fmtThaiFull(date: Date) {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function SchedulePage() {
  const [view, setView]         = useState<ViewMode>('week')
  const [cursor, setCursor]     = useState<Date>(() => startOfDay(new Date()))
  const [events, setEvents]     = useState<GCalEvent[]>([])
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [hidden, setHidden]     = useState<string[]>([])
  const [loading, setLoading]   = useState(true)
  const [errMsg, setErrMsg]     = useState('')

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const v = sp.get('view')
    const d = sp.get('date')
    if (v === 'day' || v === 'week' || v === 'month') setView(v)
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parsed = new Date(d + 'T00:00:00')
      if (!isNaN(parsed.getTime())) setCursor(parsed)
    }
  }, [])

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'day') {
      const s = startOfDay(cursor)
      return { rangeStart: s, rangeEnd: addDays(s, 1) }
    }
    if (view === 'week') {
      const s = startOfWeek(cursor)
      return { rangeStart: s, rangeEnd: addDays(s, 7) }
    }
    const gs = startOfWeek(startOfMonth(cursor))
    return { rangeStart: gs, rangeEnd: addDays(gs, 42) }
  }, [view, cursor])

  const load = useCallback(async () => {
    setLoading(true); setErrMsg('')
    try {
      const p = new URLSearchParams({ from: rangeStart.toISOString(), to: rangeEnd.toISOString() })
      const res = await fetch('/api/calendar/events?' + p.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setErrMsg(json?.error ?? 'โหลดข้อมูลไม่สำเร็จ'); setEvents([]); setAccounts([]); return }
      setEvents(json.events ?? [])
      setAccounts(json.accounts ?? [])
    } catch { setErrMsg('เชื่อมต่อ API ไม่ได้') }
    finally { setLoading(false) }
  }, [rangeStart, rangeEnd])

  useEffect(() => { load() }, [load])

  const toggleAccount = (tag: string) =>
    setHidden(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const visibleEvents = useMemo(() => events.filter(e => !hidden.includes(e.account)), [events, hidden])

  const byDay = useMemo(() => {
    const map: Record<string, GCalEvent[]> = {}
    for (const e of visibleEvents) {
      const key = e.allDay ? e.start.slice(0,10) : ymd(new Date(e.start))
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [visibleEvents])

  const todayKey = ymd(new Date())

  const step = (dir: number) => {
    if (view === 'day')        setCursor(addDays(cursor, dir))
    else if (view === 'week')  setCursor(addDays(cursor, dir * 7))
    else                       setCursor(addMonths(cursor, dir))
  }

  const goToday = () => setCursor(startOfDay(new Date()))
  const openDay = (date: Date) => { setCursor(startOfDay(date)); setView('day') }

  const headerLabel = () => {
    if (view === 'day') return fmtThaiFull(cursor)
    if (view === 'week') {
      const s = startOfWeek(cursor)
      return fmtThaiDate(s) + ' – ' + fmtThaiDate(addDays(s, 6))
    }
    return fmtThaiMonth(cursor)
  }

  const navBtn: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '8px',
    background: C.surface2,
    border: '1px solid ' + C.border,
    color: C.text,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: C.bg, colorScheme: 'dark' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: 0 }}>ตารางสอน</h1>
            <p style={{ fontSize: '13px', color: C.textMuted, marginTop: '2px' }}>
              {headerLabel()}
              {' · '}
              <a href="/staff/schedule/connect" style={{ color: C.gold, textDecoration: 'underline' }}>
                เชื่อมต่อบัญชี
              </a>
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {/* View switcher */}
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid ' + C.border }}>
              {(['day', 'week', 'month'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    background: view === v ? C.green : C.surface2,
                    color:      view === v ? '#0F1117' : C.text,
                  }}
                >
                  {v === 'day' ? 'วัน' : v === 'week' ? 'สัปดาห์' : 'เดือน'}
                </button>
              ))}
            </div>

            <button onClick={() => step(-1)} style={navBtn}>←</button>
            <button onClick={goToday} style={navBtn}>วันนี้</button>
            <button onClick={() => step(1)} style={navBtn}>→</button>
            <button
              onClick={load}
              style={{ padding: '6px 14px', borderRadius: '8px', background: C.gold, color: '#0F1117', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
            >
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {accounts.map(a => {
            const m = metaOf(a.account)
            const off = hidden.includes(a.account)
            return (
              <button
                key={a.account}
                onClick={() => toggleAccount(a.account)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px', borderRadius: '999px', fontSize: '13px',
                  opacity: off ? 0.35 : 1,
                  background: C.surface,
                  border: '1px solid ' + C.border,
                  color: C.text,
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                <span>{m.label}</span>
                <span style={{ color: C.textDim, fontSize: '11px' }}>({a.count})</span>
                {!a.ok && <span style={{ color: C.red, fontSize: '11px' }}>token เสีย</span>}
              </button>
            )
          })}
        </div>

        {errMsg && (
          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: hexAlpha(C.red, 0.15), color: C.red, fontSize: '13px', border: '1px solid ' + hexAlpha(C.red, 0.3) }}>
            {errMsg} —{' '}
            <a href="/staff/schedule/connect" style={{ color: C.red, textDecoration: 'underline' }}>ไปหน้าเชื่อมต่อ Google</a>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '14px', color: C.textMuted }}>กำลังโหลด...</div>
        )}

        {/* DAY VIEW */}
        {!loading && view === 'day' && (
          <DayView date={cursor} events={byDay[ymd(cursor)] ?? []} />
        )}

        {/* WEEK VIEW */}
        {!loading && view === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)).map((day, i) => {
              const key = ymd(day)
              const list = byDay[key] ?? []
              const isToday = key === todayKey
              return (
                <div
                  key={key}
                  style={{
                    borderRadius: '12px',
                    padding: '12px',
                    minHeight: '140px',
                    background: C.surface,
                    border: '1.5px solid ' + (isToday ? C.todayBorder : C.border),
                    boxShadow: isToday ? '0 0 0 2px ' + hexAlpha(C.green, 0.2) : undefined,
                  }}
                >
                  <button
                    onClick={() => openDay(day)}
                    style={{ width: '100%', textAlign: 'left', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid ' + C.border, background: 'none', border: 'none', borderBottom: '1px solid ' + C.border, cursor: 'pointer', padding: '0 0 8px 0' }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isToday ? C.green : C.text }}>
                      {DAYS[i]}
                    </div>
                    <div style={{ fontSize: '11px', color: C.textDim }}>{fmtThaiDate(day)}</div>
                  </button>
                  {list.length === 0 && <div style={{ fontSize: '11px', color: C.textDim, padding: '8px 0' }}>ไม่มีคลาส</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {list.map(e => <EventChip key={e.id} e={e} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MONTH VIEW */}
        {!loading && view === 'month' && (
          <div style={{ borderRadius: '12px', padding: '12px', background: C.surface, border: '1px solid ' + C.border }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
              {DAYS_SHORT.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '4px 0', color: C.green }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(cursor)), i)).map(day => {
                const key = ymd(day)
                const list = byDay[key] ?? []
                const inMonth = day.getMonth() === cursor.getMonth()
                const isToday = key === todayKey
                return (
                  <button
                    key={key}
                    onClick={() => openDay(day)}
                    style={{
                      borderRadius: '8px',
                      padding: '6px',
                      minHeight: '80px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      opacity: inMonth ? 1 : 0.25,
                      background: isToday ? C.todayBg : C.surface2,
                      border: '1px solid ' + (isToday ? C.todayBorder : C.border),
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px', color: isToday ? C.green : C.text }}>
                      {day.getDate()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {list.slice(0, 2).map(e => {
                        const m = metaOf(e.account)
                        return (
                          <div
                            key={e.id}
                            style={{
                              fontSize: '9px',
                              borderRadius: '4px',
                              padding: '1px 4px',
                              background: hexAlpha(m.color, 0.2),
                              color: m.color,
                              textDecoration: e.cancelled ? 'line-through' : undefined,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {e.allDay ? '' : fmtTime(e.start) + ' '}
                            {e.title}
                          </div>
                        )
                      })}
                      {list.length > 2 && (
                        <div style={{ fontSize: '9px', color: C.textDim, padding: '0 2px' }}>+{list.length - 2} คลาส</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!loading && visibleEvents.length === 0 && !errMsg && view !== 'month' && (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: '13px', color: C.textDim }}>ไม่มี event ในช่วงนี้</div>
        )}
      </div>
    </div>
  )
}

/* ── sub components ── */

function EventChip({ e }: { e: GCalEvent }) {
  const m = metaOf(e.account)
  return (
    <div
      style={{
        borderRadius: '8px',
        padding: '8px',
        fontSize: '11px',
        background: hexAlpha(m.color, 0.12),
        borderLeft: '3px solid ' + m.color,
        opacity: e.cancelled ? 0.45 : 1,
      }}
    >
      <div style={{ fontWeight: 600, color: '#F1F5F9', textDecoration: e.cancelled ? 'line-through' : undefined }}>
        {e.title}
      </div>
      <div style={{ color: '#94A3B8', marginTop: '2px' }}>
        {e.allDay ? 'ทั้งวัน' : fmtTime(e.start) + ' - ' + fmtTime(e.end)}
      </div>
      <div style={{ fontSize: '10px', marginTop: '2px', color: m.color }}>{m.label}</div>
      {e.meetLink && (
        <a href={e.meetLink} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#FBBF24', textDecoration: 'underline' }}>
          เข้า Google Meet
        </a>
      )}
    </div>
  )
}

function DayView({ date, events }: { date: Date; events: GCalEvent[] }) {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start))
  return (
    <div style={{ borderRadius: '12px', padding: '20px', background: '#1A1D27', border: '1px solid #2E3347' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #2E3347' }}>
        <h2 style={{ fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{fmtThaiFull(date)}</h2>
        <span style={{ fontSize: '13px', color: '#64748B' }}>{sorted.length} คลาส</span>
      </div>
      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '13px', color: '#64748B' }}>วันนี้ไม่มีคลาส</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map(e => {
          const m = metaOf(e.account)
          return (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: hexAlpha(m.color, 0.1),
                borderLeft: '4px solid ' + m.color,
                opacity: e.cancelled ? 0.45 : 1,
              }}
            >
              <div style={{ width: '80px', flexShrink: 0, fontSize: '13px', fontWeight: 500, color: '#4ADE80' }}>
                {e.allDay ? 'ทั้งวัน' : fmtTime(e.start)}
                {!e.allDay && <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>{'ถึง ' + fmtTime(e.end)}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: '#F1F5F9', textDecoration: e.cancelled ? 'line-through' : undefined }}>
                  {e.title}
                </div>
                <div style={{ fontSize: '11px', marginTop: '2px', color: m.color }}>{m.label}</div>
                {e.location && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{'📍 ' + e.location}</div>}
                {e.meetLink && (
                  <a href={e.meetLink} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#FBBF24', textDecoration: 'underline' }}>
                    เข้า Google Meet
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
