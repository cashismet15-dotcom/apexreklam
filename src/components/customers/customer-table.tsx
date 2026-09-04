import Link from "next/link"

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
import { CustomerRowActions } from "@/components/customers/customer-row-actions"
import { QuickPaymentButton } from "@/components/payments/quick-payment-button"
import type { CustomerCollectionStatus } from "@/lib/collections"
import { daysBetween, formatCurrency, formatDate } from "@/lib/format"
import type { Customer, CustomerStatus } from "@/lib/types"

const durumStil: Record<CustomerStatus, string> = {
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pasif: "bg-muted text-muted-foreground border-transparent",
  donduruldu: "bg-sky-50 text-sky-700 border-sky-200",
}

const durumEtiket: Record<CustomerStatus, string> = {
  aktif: "Aktif",
  pasif: "Pasif",
  donduruldu: "Donduruldu",
}

export function CustomerTable({
  customers,
  statusesById,
  todayIso,
  emptyMessage,
}: {
  customers: Customer[]
  statusesById: Map<string, CustomerCollectionStatus>
  todayIso: string
  emptyMessage: string
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Firma</TableHead>
              <TableHead>Yetkili / Telefon</TableHead>
              <TableHead>Aylık Ücret</TableHead>
              <TableHead>Ödeme Günü</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Bu Ay</TableHead>
              <TableHead className="text-right">Başlangıç</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((musteri) => {
                const status = statusesById.get(musteri.id)
                return (
                  <TableRow key={musteri.id}>
                    <TableCell>
                      <Link
                        href={`/muhasebe/musteriler/${musteri.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {musteri.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{musteri.contact_name}</span>
                        <span className="text-xs text-muted-foreground">{musteri.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatCurrency(musteri.monthly_fee)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Her ayın {musteri.payment_day}&apos;i
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-normal ${durumStil[musteri.status]}`}>
                        {durumEtiket[musteri.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {musteri.status === "pasif" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : musteri.status === "donduruldu" ? (
                        <Badge
                          variant="outline"
                          className="font-normal bg-sky-50 text-sky-700 border-sky-200"
                        >
                          {musteri.frozen_since
                            ? `${daysBetween(musteri.frozen_since, todayIso)} gündür donduruldu`
                            : "Donduruldu"}
                        </Badge>
                      ) : status?.isPaidThisMonth ? (
                        <Badge
                          variant="outline"
                          className="font-normal bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          Ödendi
                        </Badge>
                      ) : status?.isOverdue ? (
                        <Badge
                          variant="outline"
                          className="font-normal bg-red-50 text-red-700 border-red-200"
                        >
                          {status.isPartiallyPaid
                            ? `Kalan ${formatCurrency(status.remainingThisMonth)} gecikti`
                            : "Gecikti"}
                        </Badge>
                      ) : status?.isPartiallyPaid ? (
                        <Badge
                          variant="outline"
                          className="font-normal bg-sky-50 text-sky-700 border-sky-200"
                        >
                          Kısmi · Kalan {formatCurrency(status.remainingThisMonth)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-normal bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Bekliyor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(musteri.start_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {musteri.status === "aktif" && !status?.isPaidThisMonth ? (
                          <QuickPaymentButton
                            customer={musteri}
                            remainingAmount={status?.remainingThisMonth}
                            size="sm"
                          />
                        ) : null}
                        <CustomerRowActions customer={musteri} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
