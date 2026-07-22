import { ArrowDownLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDateShort } from "@/lib/format"
import type { PaymentWithCustomer } from "@/lib/types"

export function RecentPayments({ payments }: { payments: PaymentWithCustomer[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">
          Son Alınan Ödemeler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {payments.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Henüz ödeme kaydı yok.</p>
        ) : (
          <ul className="flex flex-col">
            {payments.map((odeme) => (
              <li
                key={odeme.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ArrowDownLeft className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {odeme.customer.company_name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {odeme.customer.contact_name}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium tabular-nums text-emerald-600">
                    +{formatCurrency(odeme.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateShort(odeme.payment_date)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
