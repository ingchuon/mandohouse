// src/app/api/calendar/debug/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getAccessToken(refreshToken: string) {
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
  const json = await res.json()
  return { ok: res.ok, status: res.status, data: json }
}

async function getCalendarList(accessToken: string) {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }
  )
  const json = await res.json()
  return { ok: res.ok, status: res.status, data: json }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: tokens } = await supabase
    .from('google_calendar_tokens')
    .select('account_tag, email, refresh_token')

  const results = await Promise.all(
    (tokens ?? []).map(async (t: any) => {
      const tokenResult = await getAccessToken(t.refresh_token)
      if (!tokenResult.ok) {
        return { account: t.account_tag, email: t.email, tokenError: tokenResult.data }
      }
      const accessToken = tokenResult.data.access_token
      const calResult = await getCalendarList(accessToken)
      return {
        account: t.account_tag,
        email: t.email,
        calendars: calResult.data?.items?.map((c: any) => ({
          id: c.id,
          summary: c.summary,
          accessRole: c.accessRole,
        })) ?? [],
        calendarError: calResult.ok ? null : calResult.data,
      }
    })
  )

  return NextResponse.json(results)
}
