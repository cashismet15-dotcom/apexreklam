import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AddLeadButton } from "@/components/panel/add-lead-button"
import { LeadList } from "@/components/panel/lead-list"
import { getSessionRole } from "@/lib/auth-role"
import { canViewCustomers, toTeamRole } from "@/lib/panel"
import { getPanelLeads } from "@/lib/panel-data"

export default async function PanelLeadsPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role || !canViewCustomers(role)) notFound()

  const leads = await getPanelLeads()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Potansiyel Müşteriler"
        description="Henüz Şirketler'e dönüşmemiş adaylar — isim, telefon, not."
        actions={<AddLeadButton />}
      />
      <LeadList leads={leads} />
    </div>
  )
}
