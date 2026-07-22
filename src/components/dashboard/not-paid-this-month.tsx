import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, kalanGunEtiketi } from "@/lib/format"
import type { CustomerCollectionStatus } from "@/lib/collections"
import { cn } from "@/lib/utils"

function durumBadgeClass(s: CustomerCollectionStatus): string {
  if (s.isOverdue) return "bg-red-50 text-red-700 border-red-200"
  if (s.daysUntilDue === 0) return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-muted text-muted-foreground border-transparent"
}

export function NotPaidThisMonth({ items }: { items: CustomerCollectionStatus[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">
          Bu Ay Ödeme Yapmayan Müşteriler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Firma</TableHead>
              <TableHead>Kalan Tutar</TableHead>
              <TableHead className="text-right">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">
                  Bu ay herkes ödemesini yaptı.
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.customer.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{s.customer.company_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.customer.contact_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    {formatCurrency(s.remainingThisMonth)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={cn("font-normal", durumBadgeClass(s))}>
                      {kalanGunEtiketi(s.dueDate)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
