import { notFound } from "next/navigation"

import { PanelSidebar } from "@/components/layout/panel-sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSessionRole } from "@/lib/auth-role"
import { toTeamRole } from "@/lib/panel"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  return (
    <SidebarProvider>
      <PanelSidebar role={role} />
      <SidebarInset>
        <TopBar searchPlaceholder="Şirket ara..." />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
