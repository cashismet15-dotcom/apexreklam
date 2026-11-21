import { notFound } from "next/navigation"

import { AddServiceButton, ServiceCatalog } from "@/components/firms/service-catalog"
import { PageHeader } from "@/components/layout/page-header"
import { getSessionRole } from "@/lib/auth-role"
import { getServices } from "@/lib/firms-data"
import { toTeamRole } from "@/lib/panel"

export default async function HizmetlerPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  // Fiyatlar sadece owner'da görünüyor.
  if (role !== "owner") notFound()

  const services = await getServices()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Hizmetler"
        description="Verdiğimiz hizmetler ve fiyatları — firmayı müşteri yaparken buradan seçilir."
        actions={<AddServiceButton />}
      />
      <ServiceCatalog services={services} />
    </div>
  )
}
