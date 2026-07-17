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
  selected?: boolean
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

/** ดึง events ทุก calendar ของ 1 account */
async function fetchAllEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const calendars = await fetchCalendarList(accessToken)

  // ดึงเฉพาะ calendar ที่ owner หรือ writer (ไม่เอา Birthdays, Tasks, Holidays)
  const relevantCalendars = calendars.filter(
    (cal) =>
      cal.accessRole === 'owner' || cal.accessRole === 'writer'
  )

  const allResults = await Promise.all(
    relevantCalendars.map((cal) =>
      fetchEventsFromCalendar(accessToken, cal.id, timeMin, timeMax)
    )
  )

  // รวม events และ deduplicate ด้วย id
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

  // ---- ช่วงเวลา ----
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

  // ---- อ่าน token ทั้ง 3 account ----
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

  // ---- ดึงพร้อมกันทุก account ----
  const results = await Promise.all(
    rows.map(async (t) => {
      const accessToken = await getAccessToken(t.refresh_token)
      if (!accessToken) {
        return { account: t.account_tag, email: t.email, ok: false, events: [] }
      }

      const items = await fetchAllEvents(accessToken, timeMin, timeMax)

      const events = items
        .filter((e) => e.status !== 'cancelled')
        .map((e) => {
          const title = e.summary ?? '(ไม่มีชื่อ)'
          return {
            id: `${t.account_tag}-${e.id}`,
            title,
            start: e.start?.dateTime ?? e.start?.date ?? '',
            end: e.end?.dateTime ?? e.end?.date ?? '',
            allDay: !e.start?.dateTime,
            account: t.account_tag,
            email: t.email,
            description: e.description ?? '',
            location: e.location ?? '',
            meetLink: e.hangoutLink ?? '',
            cancelled: title.includes('❌'),
          }
        })
        .filter((e) => e.start !== '')

      return { account: t.account_tag, email: t.email, ok: true, events }
    })
  )

  const allEvents = results
    .flatMap((r) => r.events)
    .sort((a, b) => a.start.localeCompare(b.start))

  return NextResponse.json({
    events: allEvents,
    accounts: results.map((r) => ({
      account: r.account,
      email: r.email,
      ok: r.ok,
      count: r.events.length,
    })),
    timeMin,
    timeMax,
  })
}
