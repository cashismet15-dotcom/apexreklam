import { ManifestExperience } from "@/components/manifest/manifest-experience"
import { getCustomers, getPayments } from "@/lib/data"

export default async function ManifestPage() {
  const [customers, payments] = await Promise.all([getCustomers(), getPayments()])

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0)
  const activeCustomerCount = customers.filter((c) => c.status === "aktif").length

  return (
    <ManifestExperience totalRevenue={totalRevenue} activeCustomerCount={activeCustomerCount} />
  )
}
