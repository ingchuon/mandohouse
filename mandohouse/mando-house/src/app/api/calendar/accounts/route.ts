// src/app/api/calendar/accounts/route.ts
// คืนรายการ account ที่ school ปัจจุบันเชื่อมต่อไว้
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ accounts: [] }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = profile?.school_id
  if (!schoolId) {
    return NextResponse.json({ accounts: [] })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data } = await service
    .from('google_calendar_tokens')
    .select('account_tag, email, updated_at')
    .eq('school_id', schoolId)
    .order('updated_at', { ascending: false })

  return NextResponse.json({ accounts: data ?? [] })
}
