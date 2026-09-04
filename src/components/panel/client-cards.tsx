import Link from "next/link"

import { PaymentStatusBadge } from "@/components/panel/payment-status-badge"
import { Card, CardContent } from "@/components/ui/card"
import type { CustomerCollectionStatus } from "@/lib/collections"
import { formatCurrency } from "@/lib/format"

export function ClientCards({
  statuses,
  showAmounts,
}: {
  statuses: CustomerCollectionStatus[]
  showAmounts: boolean
}) {
  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          Henüz aktif müşteri yok.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {statuses.map((status) => (
        <Link
          key={status.customer.id}
          href={`/panel/${status.customer.id}`}
          className="group flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold">{status.customer.company_name}</span>
            <PaymentStatusBadge status={status} />
          </div>
          <span className="text-xs text-muted-foreground">
            {status.customer.contact_name} · {status.customer.phone}
          </span>
          {showAmounts ? (
            <span className="text-xs text-muted-foreground">
              Aylık ücret: {formatCurrency(status.customer.monthly_fee)}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
