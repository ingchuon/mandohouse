// src/app/staff/layout.tsx
import StaffSidebar from '@/components/layout/StaffSidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role === 'parent') redirect('/parent')
  if (!profile || profile.role !== 'staff') redirect('/login')

  return (
    <div className="flex min-h-screen">
      <StaffSidebar />
      <main className="flex-1 overflow-auto bg-surface">
        {children}
      </main>
    </div>
  )
}
