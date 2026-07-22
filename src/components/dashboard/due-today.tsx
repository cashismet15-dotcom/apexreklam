import { CalendarCheck2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { CustomerCollectionStatus } from "@/lib/collections"

export function DueToday({ items }: { items: CustomerCollectionStatus[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">
          Bugün Ödeme Yapacak Müşteriler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {items.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Bugün vadesi gelen ödeme yok.</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((s) => (
              <li
                key={s.customer.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <CalendarCheck2 className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {s.customer.company_name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {s.customer.contact_name}
                  </span>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(s.remainingThisMonth)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
