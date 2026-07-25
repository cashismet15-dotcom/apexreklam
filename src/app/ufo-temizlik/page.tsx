import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
import { NewUfoAppointmentButton } from "@/components/ufo/new-ufo-appointment-button"
import { NewUfoJobButton } from "@/components/ufo/new-ufo-job-button"
import { UfoJobRowActions } from "@/components/ufo/ufo-job-row-actions"
import { UfoStatsGrid } from "@/components/ufo/ufo-stats-grid"
import { getUfoJobs } from "@/lib/ufo-data"
import { UFO_STATUS_LABELS, computeUfoStats, ufoJobTypeLabel } from "@/lib/ufo"
import { formatCurrency, formatDate } from "@/lib/format"
import type { UfoJobStatus } from "@/lib/types"

const STATUS_BADGE_CLASS: Record<UfoJobStatus, string> = {
  bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  tamamlandi: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iptal: "bg-red-50 text-red-700 border-red-200",
}

export default async function UfoTemizlikPage() {
  const jobs = await getUfoJobs()
  const stats = computeUfoStats(jobs)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Ana Sayfa
      </Link>

      <PageHeader
        title="Ufo Temizlik"
        description="Ev temizliği ve koltuk yıkama iş & ciro takibi — Apex muhasebesinden bağımsız."
        actions={
          <div className="flex items-center gap-2">
            <NewUfoAppointmentButton />
            <NewUfoJobButton />
          </div>
        }
      />

      <UfoStatsGrid stats={stats} />

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Tarih</TableHead>
                <TableHead>Hizmet</TableHead>
                <TableHead>Ev Tipi</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">
                    Henüz iş kaydı yok.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(job.job_date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{ufoJobTypeLabel(job)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.home_type ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.location || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.customer_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.customer_phone || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-emerald-600">
                      {formatCurrency(job.amount)}
                      {job.commission_amount > 0 ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          Komisyon: {formatCurrency(job.commission_amount)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {job.record_type === "randevu" ? (
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 font-normal"
                        >
                          Randevu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`font-normal ${STATUS_BADGE_CLASS[job.status]}`}>
                          {UFO_STATUS_LABELS[job.status]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <UfoJobRowActions job={job} />
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
