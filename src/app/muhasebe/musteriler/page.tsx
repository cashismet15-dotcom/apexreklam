import { PageHeader } from "@/components/layout/page-header"
import { CustomerTable } from "@/components/customers/customer-table"
import { NewCustomerButton } from "@/components/customers/new-customer-button"
import { computeCollectionStatuses } from "@/lib/collections"
import { getCustomers, getPayments } from "@/lib/data"

export default async function MusterilerPage() {
  const [musteriler, odemeler] = await Promise.all([getCustomers(), getPayments()])
  const statuses = computeCollectionStatuses(musteriler, odemeler)
  const statusesById = new Map(statuses.map((s) => [s.customer.id, s]))
  const todayIso = new Date().toISOString().slice(0, 10)

  const aktifMusteriler = musteriler.filter((m) => m.status === "aktif")
  const donduruldular = musteriler.filter((m) => m.status === "donduruldu")
  const pasifMusteriler = musteriler.filter((m) => m.status === "pasif")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Müşteriler"
        description={`${musteriler.length} müşteri kayıtlı`}
        actions={<NewCustomerButton />}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Aktif Müşteriler ({aktifMusteriler.length})
        </h2>
        <CustomerTable
          customers={aktifMusteriler}
          statusesById={statusesById}
          todayIso={todayIso}
          emptyMessage="Aktif müşteri yok."
        />
      </div>

      {donduruldular.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Dondurulmuş Müşteriler ({donduruldular.length})
          </h2>
          <CustomerTable
            customers={donduruldular}
            statusesById={statusesById}
            todayIso={todayIso}
            emptyMessage="Dondurulmuş müşteri yok."
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Pasif Müşteriler ({pasifMusteriler.length})
        </h2>
        <CustomerTable
          customers={pasifMusteriler}
          statusesById={statusesById}
          todayIso={todayIso}
          emptyMessage="Pasif müşteri yok."
        />
      </div>
    </div>
  )
}
