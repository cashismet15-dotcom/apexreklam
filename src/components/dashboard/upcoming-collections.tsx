import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, kalanGunEtiketi } from "@/lib/format"
import { amountDue, type CustomerCollectionStatus } from "@/lib/collections"
import { cn } from "@/lib/utils"

function kalanGunBadgeClass(gun: number): string {
  if (gun === 0) return "bg-amber-50 text-amber-700 border-amber-200"
  if (gun <= 3) return "bg-orange-50 text-orange-700 border-orange-200"
  return "bg-muted text-muted-foreground border-transparent"
}

export function UpcomingCollections({ items }: { items: CustomerCollectionStatus[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">
          Yaklaşan Tahsilatlar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Firma</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Kalan Gün</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                  Yaklaşan tahsilat yok.
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.customer.id}>
                  <TableCell>
                    <span className="text-sm font-medium">{s.customer.company_name}</span>
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    {formatCurrency(amountDue(s))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(s.dueDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn("font-normal", kalanGunBadgeClass(s.daysUntilDue))}
                    >
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
