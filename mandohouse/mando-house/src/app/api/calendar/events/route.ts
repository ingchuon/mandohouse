// src/app/api/calendar/events/debug/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
      // ขอ access_token พร้อม log ทุกอย่าง
      const body = new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: t.refresh_token,
        grant_type:    'refresh_token',
      })

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store',
      })

      const json = await res.json()

      if (!res.ok) {
        return {
          account: t.account_tag,
          email: t.email,
          token_ok: false,
          http_status: res.status,
          error: json,
          refresh_token_prefix: t.refresh_token?.slice(0, 20),
          env_client_id_set: !!process.env.GOOGLE_CLIENT_ID,
          env_client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
        }
      }

      // ดึง calendar list ถ้า token ได้มา
      const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
        {
          headers: { Authorization: `Bearer ${json.access_token}` },
          cache: 'no-store',
        }
      )
      const calJson = await calRes.json()

      return {
        account: t.account_tag,
        email: t.email,
        token_ok: true,
        scope: json.scope,
        calendars: calJson.items?.map((c: any) => ({
          id: c.id,
          summary: c.summary,
          accessRole: c.accessRole,
        })) ?? [],
        calendar_error: calRes.ok ? null : calJson,
      }
    })
  )

  return NextResponse.json(results)
}
