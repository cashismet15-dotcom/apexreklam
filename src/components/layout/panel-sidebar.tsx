"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bug,
  Building2,
  FileText,
  LayoutDashboard,
  StickyNote,
  UserRound,
  Video,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/auth/logout-button"
import { initials } from "@/lib/format"
import { TEAM_MEMBER_LABEL } from "@/lib/panel"
import type { TeamMemberRole } from "@/lib/types"

const menu = [
  { title: "Dashboard", href: "/panel", icon: LayoutDashboard },
  { title: "Şirketler", href: "/panel/sirketler", icon: Building2 },
  { title: "Sunumlar", href: "/panel/sunumlar", icon: FileText },
  { title: "Video Montajları", href: "/panel/videolar", icon: Video },
  { title: "Reklam Raporları", href: "/panel/raporlar", icon: BarChart3 },
  { title: "Hata Takibi", href: "/panel/hatalar", icon: Bug },
  { title: "Notlar", href: "/panel/notlar", icon: StickyNote },
  { title: "Profil", href: "/panel/profil", icon: UserRound },
]

export function PanelSidebar({ role }: { role: TeamMemberRole }) {
  const pathname = usePathname()
  const label = TEAM_MEMBER_LABEL[role]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link href="/panel" className="flex items-center gap-2 px-1">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            A
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Panel</span>
            <span className="text-xs text-muted-foreground">Ekip CRM&apos;i</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item) => {
                const active =
                  item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 px-3 pb-4">
        <Link
          href="/panel/profil"
          className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {initials(label)}
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">Profili gör</span>
          </div>
        </Link>
        <LogoutButton className="w-full justify-start group-data-[collapsible=icon]:justify-center" />
      </SidebarFooter>
    </Sidebar>
  )
}
