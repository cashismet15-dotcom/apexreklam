import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AddClientButton } from "@/components/panel/add-client-button"
import { ClientCards } from "@/components/panel/client-cards"
import { getSessionRole } from "@/lib/auth-role"
import { canManageCustomers, toTeamRole } from "@/lib/panel"
import { getPanelCustomerStatuses } from "@/lib/panel-data"

export default async function PanelSirketlerPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const statuses = await getPanelCustomerStatuses()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Şirketler"
        description="Tüm müşteri kartları — ödeme durumu, görevler ve raporlar."
        actions={canManageCustomers(role) ? <AddClientButton /> : null}
      />
      <ClientCards statuses={statuses} showAmounts={role === "owner"} />
    </div>
  )
}
