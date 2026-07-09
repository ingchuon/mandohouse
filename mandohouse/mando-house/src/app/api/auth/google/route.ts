// src/app/api/auth/google/route.ts
// Step 1: redirect ไป Google OAuth
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const account = searchParams.get('account') ?? 'main'

  const clientId     = process.env.GOOGLE_CLIENT_ID!
  const redirectUri  = process.env.NEXT_PUBLIC_SITE_URL + '/api/auth/google/callback'

  const scope = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ')

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',     clientId)
  url.searchParams.set('redirect_uri',  redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope',         scope)
  url.searchParams.set('access_type',   'offline')
  url.searchParams.set('prompt',        'consent')   // บังคับให้ได้ refresh_token ทุกครั้ง
  url.searchParams.set('state',         account)     // ส่ง account tag ไปด้วย

  return NextResponse.redirect(url.toString())
}
