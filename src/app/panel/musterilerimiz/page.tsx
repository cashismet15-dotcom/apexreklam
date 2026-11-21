import { notFound } from "next/navigation"

import { FirmCards } from "@/components/firms/firm-cards"
import { PageHeader } from "@/components/layout/page-header"
import { getSessionRole } from "@/lib/auth-role"
import { getFirms } from "@/lib/firms-data"
import { canViewCustomers, toTeamRole } from "@/lib/panel"

export default async function MusterilerimizPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role || !canViewCustomers(role)) notFound()

  const firms = await getFirms(["olumlu"])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Müşterilerimiz"
        description="Olumlu sonuçlanıp çalışmaya başladığımız firmalar."
      />
      <FirmCards firms={firms} emptyLabel="Henüz müşterimiz olan firma yok." />
    </div>
  )
}
