import StaffSidebar from '@/components/layout/StaffSidebar'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <StaffSidebar />
      <main className="flex-1 overflow-auto bg-surface pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
