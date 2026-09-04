import { notFound } from "next/navigation"
import { Users, UserPlus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AddLeadButton } from "@/components/panel/add-lead-button"
import { LeadList } from "@/components/panel/lead-list"
import { StatCard } from "@/components/dashboard/stat-card"
import { getSessionRole } from "@/lib/auth-role"
import { todayIso, weekStartIso } from "@/lib/daily-tracker"
import { canViewCustomers, toTeamRole } from "@/lib/panel"
import { getPanelLeads } from "@/lib/panel-data"

export default async function PanelLeadsPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role || !canViewCustomers(role)) notFound()

  const leads = await getPanelLeads()
  const weekStart = weekStartIso(todayIso())
  const addedThisWeek = leads.filter((l) => l.created_at.slice(0, 10) >= weekStart).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Potansiyel Müşteriler"
        description="Henüz Şirketler'e dönüşmemiş adaylar — isim, telefon, not."
        actions={<AddLeadButton />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Toplam Potansiyel Müşteri" value={String(leads.length)} icon={Users} tone="blue" />
        <StatCard
          label="Bu Hafta Eklenen"
          value={String(addedThisWeek)}
          icon={UserPlus}
          tone="emerald"
        />
      </div>

      <LeadList leads={leads} />
    </div>
  )
}
