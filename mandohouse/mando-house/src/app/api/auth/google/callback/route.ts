// src/app/api/auth/google/callback/route.ts
// Step 2: รับ code จาก Google แล้วแลก refresh_token เก็บใน Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code    = searchParams.get('code')
  const account = searchParams.get('state') ?? 'main'
  const error   = searchParams.get('error')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  if (error || !code) {
    return NextResponse.redirect(`${siteUrl}/staff/schedule?error=google_denied`)
  }

  // แลก code → tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  siteUrl + '/api/auth/google/callback',
      grant_type:    'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${siteUrl}/staff/schedule?error=no_refresh_token`)
  }

  // ดึง email จาก userinfo
  const userRes  = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = await userRes.json()

  // เก็บ refresh_token ใน Supabase (ตาราง google_calendar_tokens)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await supabase.from('google_calendar_tokens').upsert({
    account_tag:   account,
    email:         userInfo.email,
    refresh_token: tokens.refresh_token,
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'account_tag' })

  return NextResponse.redirect(`${siteUrl}/staff/schedule?success=connected&email=${userInfo.email}`)
}
