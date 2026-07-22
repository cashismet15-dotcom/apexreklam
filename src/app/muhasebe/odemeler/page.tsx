import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NewPaymentButton } from "@/components/payments/new-payment-button"
import { PaymentRowActions } from "@/components/payments/payment-row-actions"
import { getCustomersForSelect, getPayments } from "@/lib/data"
import { AY_ADLARI, formatCurrency, formatDate } from "@/lib/format"

export default async function OdemelerPage() {
  const [odemeler, musteriler] = await Promise.all([getPayments(), getCustomersForSelect()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ödemeler"
        description={`${odemeler.length} ödeme kaydı`}
        actions={<NewPaymentButton customers={musteriler} />}
      />

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Firma</TableHead>
                <TableHead>Hangi Ay İçin</TableHead>
                <TableHead>Ödeme Tarihi</TableHead>
                <TableHead>Not</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {odemeler.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Henüz ödeme kaydı yok.
                  </TableCell>
                </TableRow>
              ) : (
                odemeler.map((odeme) => (
                  <TableRow key={odeme.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {odeme.customer.company_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {odeme.customer.contact_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {AY_ADLARI[odeme.month - 1]} {odeme.year}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(odeme.payment_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {odeme.note || "—"}
                      {odeme.expected_remaining_date ? (
                        <span className="mt-1 block">
                          <Badge
                            variant="outline"
                            className="font-normal bg-sky-50 text-sky-700 border-sky-200"
                          >
                            Kapora · kalan {formatDate(odeme.expected_remaining_date)}
                          </Badge>
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-emerald-600">
                      +{formatCurrency(odeme.amount)}
                    </TableCell>
                    <TableCell>
                      <PaymentRowActions payment={odeme} customers={musteriler} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
