// src/app/api/calendar/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TokenRow = {
  account_tag: string
  email: string
  refresh_token: string
}

type GoogleEvent = {
  id: string
  summary?: string
  description?: string
  location?: string
  status?: string
  hangoutLink?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

type GoogleCalendar = {
  id: string
  summary?: string
  accessRole?: string
}

/** ขอ access_token ใหม่จาก refresh_token */
async function getAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { access_token?: string }
  return json.access_token ?? null
}

/** ดึงรายการ calendar ทั้งหมดของ account */
async function fetchCalendarList(accessToken: string): Promise<GoogleCalendar[]> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  )
  if (!res.ok) return []
  const json = (await res.json()) as { items?: GoogleCalendar[] }
  return json.items ?? []
}

/** ดึง events จาก calendar หนึ่งๆ */
async function fetchEventsFromCalendar(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  )
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '250')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = (await res.json()) as { items?: GoogleEvent[] }
  return json.items ?? []
}

/** ดึง events ทุก calendar ของ 1 account — deduplicate ด้วย event id จริง */
async function fetchAllEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const calendars = await fetchCalendarList(accessToken)

  const relevantCalendars = calendars.filter(
    (cal) =>
      cal.accessRole === 'owner' ||
      cal.accessRole === 'writer' ||
      cal.accessRole === 'reader'
  )

  const allResults = await Promise.all(
    relevantCalendars.map((cal) =>
      fetchEventsFromCalendar(accessToken, cal.id, timeMin, timeMax)
    )
  )

  // deduplicate ด้วย event id จริงของ Google
  const seen = new Set<string>()
  const merged: GoogleEvent[] = []
  for (const items of allResults) {
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        merged.push(item)
      }
    }
  }
  return merged
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'missing_supabase_env', events: [] },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const now = new Date()
  const timeMin = fromParam
    ? new Date(fromParam).toISOString()
    : new Date(now.getTime() - 7 * 86400000).toISOString()
  const timeMax = toParam
    ? new Date(toParam).toISOString()
    : new Date(now.getTime() + 30 * 86400000).toISOString()

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data: tokens, error } = await supabase
    .from('google_calendar_tokens')
    .select('account_tag, email, refresh_token')

  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message, events: [] },
      { status: 500 }
    )
  }

  const rows = (tokens ?? []) as TokenRow[]
  if (rows.length === 0) {
    return NextResponse.json({ events: [], accounts: [], timeMin, timeMax })
  }

  // ดึงพร้อมกันทุก account แต่ deduplicate ข้าม account ด้วย event id จริง
  const allRawResults = await Promise.all(
    rows.map(async (t) => {
      const accessToken = await getAccessToken(t.refresh_token)
      if (!accessToken) {
        return { account: t.account_tag, email: t.email, ok: false, items: [] as GoogleEvent[] }
      }
      const items = await fetchAllEvents(accessToken, timeMin, timeMax)
      return { account: t.account_tag, email: t.email, ok: true, items }
    })
  )

  // รวม events จากทุก account — deduplicate ข้าม account ด้วย Google event id จริง
  // โดยเก็บเฉพาะ account แรกที่เจอ event นั้น (main มาก่อน)
  const globalSeen = new Set<string>()
  const allEvents: any[] = []
  const accountStats: any[] = []

  for (const result of allRawResults) {
    let count = 0
    if (result.ok) {
      for (const e of result.items) {
        if (!globalSeen.has(e.id)) {
          globalSeen.add(e.id)
          const title = e.summary ?? '(ไม่มีชื่อ)'
          allEvents.push({
            id: e.id,
            title,
            start: e.start?.dateTime ?? e.start?.date ?? '',
            end: e.end?.dateTime ?? e.end?.date ?? '',
            allDay: !e.start?.dateTime,
            account: result.account,
            email: result.email,
            description: e.description ?? '',
            location: e.location ?? '',
            meetLink: e.hangoutLink ?? '',
            cancelled: title.includes('❌'),
          })
          count++
        }
      }
    }
    accountStats.push({
      account: result.account,
      email: result.email,
      ok: result.ok,
      count,
    })
  }

  allEvents.sort((a, b) => a.start.localeCompare(b.start))

  return NextResponse.json({
    events: allEvents,
    accounts: accountStats,
    timeMin,
    timeMax,
  })
}
