import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { computeCollectionStatuses, computeMonthlyHistory } from "@/lib/collections"
import { MonthlyHistoryGrid } from "@/components/customers/monthly-history-grid"
import { getCustomerById, getPaymentsForCustomer } from "@/lib/data"
import { AY_ADLARI, formatCurrency, formatDate } from "@/lib/format"
import type { CustomerStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const durumStil: Record<CustomerStatus, string> = {
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pasif: "bg-muted text-muted-foreground border-transparent",
}

const durumEtiket: Record<CustomerStatus, string> = {
  aktif: "Aktif",
  pasif: "Pasif",
}

export default async function MusteriDetayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  const payments = await getPaymentsForCustomer(id)
  const [status] = computeCollectionStatuses([customer], payments)
  const monthlyHistory = computeMonthlyHistory(customer, payments, 6)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/muhasebe/musteriler"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Müşterilere dön
      </Link>

      <PageHeader
        title={customer.company_name}
        description={`${customer.contact_name} · ${customer.phone}`}
        actions={
          <div className="flex items-center gap-2">
            {customer.status === "aktif" && !status?.isPaidThisMonth ? (
              <QuickPaymentButton customer={customer} remainingAmount={status?.remainingThisMonth} />
            ) : null}
            <CustomerRowActions customer={customer} />
          </div>
        }
      />

      <MonthlyHistoryGrid entries={monthlyHistory} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Durum</span>
              <Badge
                variant="outline"
                className={cn("font-normal", durumStil[customer.status])}
              >
                {durumEtiket[customer.status]}
              </Badge>
            </div>

            {customer.status === "aktif" ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bu Ay</span>
                {status?.isPaidThisMonth ? (
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
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aylık Ücret</span>
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(customer.monthly_fee)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ödeme Günü</span>
              <span className="text-sm">Her ayın {customer.payment_day}&apos;i</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Başlangıç Tarihi</span>
              <span className="text-sm">{formatDate(customer.start_date)}</span>
            </div>

            {customer.notes ? (
              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-sm text-muted-foreground">Not</span>
                <span className="text-sm whitespace-pre-wrap">{customer.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 lg:col-span-2">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base font-semibold">
              Ödeme Geçmişi ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Hangi Ay İçin</TableHead>
                  <TableHead>Ödeme Tarihi</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                      Henüz ödeme kaydı yok.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((odeme) => (
                    <TableRow key={odeme.id}>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
