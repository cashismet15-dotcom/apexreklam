"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bug,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  StickyNote,
  UserPlus,
  UserRound,
  Users,
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
import { TeamAvatar } from "@/components/panel/team-avatar"
import { TEAM_MEMBER_LABEL, canViewCustomers } from "@/lib/panel"
import type { TeamMemberRole } from "@/lib/types"

interface MenuItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
}

function buildMenu(role: TeamMemberRole): MenuItem[] {
  const items: MenuItem[] = [{ title: "Dashboard", href: "/panel", icon: LayoutDashboard }]

  // Şirketler ve Potansiyel Müşteriler (müşteri verisiyle ilgili her şey) — sadece owner ve Batuhan.
  if (canViewCustomers(role)) {
    items.push(
      { title: "Şirketler", href: "/panel/sirketler", icon: Building2 },
      { title: "Potansiyel Müşteriler", href: "/panel/potansiyel-musteriler", icon: UserPlus }
    )
  }

  items.push(
    { title: "Toplantılar", href: "/panel/toplantilar", icon: CalendarClock },
    { title: "Sunumlar", href: "/panel/sunumlar", icon: FileText },
    { title: "Video Montajları", href: "/panel/videolar", icon: Video },
    { title: "Reklam Raporları", href: "/panel/raporlar", icon: BarChart3 },
    { title: "Hata Takibi", href: "/panel/hatalar", icon: Bug },
    { title: "Notlar", href: "/panel/notlar", icon: StickyNote },
    { title: "Arkadaşlar", href: "/panel/arkadaslar", icon: Users },
    { title: "Profil", href: "/panel/profil", icon: UserRound }
  )

  return items
}

export function PanelSidebar({
  role,
  avatarUrl,
}: {
  role: TeamMemberRole
  avatarUrl: string | null
}) {
  const pathname = usePathname()
  const label = TEAM_MEMBER_LABEL[role]
  const menu = buildMenu(role)
  // Ekip (huseyin/batuhan) yalnızca /panel ve /gorevler'e erişebiliyor — "/" onları
  // zaten proxy'de geri /panel'e atar. Owner (İsmet) ise tüm modüllere erişiyor,
  // o yüzden logo ana sayfaya çıksın — Panel'e girip çıkabilsin.
  const headerHref = role === "owner" ? "/" : "/panel"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link href={headerHref} className="flex items-center gap-2 px-1">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            A
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Panel</span>
            <span className="text-xs text-muted-foreground">
              {role === "owner" ? "Ana sayfaya dön" : "Ekip CRM'i"}
            </span>
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
          <TeamAvatar label={label} url={avatarUrl} className="text-xs font-medium" />
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
