import Link from "next/link"
import { ArrowLeft, CalendarDays, Handshake } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LogoutButton } from "@/components/auth/logout-button"
import { NewUfoAppointmentButton } from "@/components/ufo/new-ufo-appointment-button"
import { NewUfoJobButton } from "@/components/ufo/new-ufo-job-button"
import { UfoJobRowActions } from "@/components/ufo/ufo-job-row-actions"
import { UfoStatsGrid } from "@/components/ufo/ufo-stats-grid"
import { getSessionRole } from "@/lib/auth-role"
import { getUfoJobs } from "@/lib/ufo-data"
import { UFO_STATUS_LABELS, computeUfoStats, ufoJobTypeLabel } from "@/lib/ufo"
import { formatCurrency, formatDate, formatTime } from "@/lib/format"
import type { UfoJobStatus } from "@/lib/types"

const STATUS_BADGE_CLASS: Record<UfoJobStatus, string> = {
  bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  tamamlandi: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iptal: "bg-red-50 text-red-700 border-red-200",
}

export default async function UfoTemizlikPage() {
  const [jobs, session] = await Promise.all([getUfoJobs(), getSessionRole()])
  const stats = computeUfoStats(jobs)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        {session?.role === "owner" ? (
          <Link
            href="/"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Ana Sayfa
          </Link>
        ) : (
          <span />
        )}
        <LogoutButton />
      </div>

      <PageHeader
        title="Ufo Temizlik"
        description="Ev temizliği ve koltuk yıkama iş & ciro takibi — Apex muhasebesinden bağımsız."
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href="/ufo-temizlik/takvim">
                <CalendarDays />
                Takvim
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/ufo-temizlik/taseron-firmalar">
                <Handshake />
                Taşeron Firmalar
              </Link>
            </Button>
            <NewUfoAppointmentButton />
            <NewUfoJobButton />
          </>
        }
      />

      <UfoStatsGrid stats={stats} />

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Henüz iş kaydı yok.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobil: kart listesi (küçük ekranda yatay kaydırma gerektiren tablo yerine) */}
          <div className="flex flex-col gap-3 md:hidden">
            {jobs.map((job) => (
              <Card key={job.id} size="sm">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/ufo-temizlik/${job.id}`} className="text-sm font-medium hover:underline">
                        {ufoJobTypeLabel(job)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.home_type ?? "—"}</p>
                    </div>
                    <UfoJobRowActions job={job} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
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
                    {job.open_to_partners ? (
                      job.taken_by_partner_id ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal"
                        >
                          {job.taken_by_partner?.name ?? "Alındı"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 font-normal"
                        >
                          Havuzda
                        </Badge>
                      )
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    <span>{job.location || "—"}</span>
                    <span>
                      {job.customer_name || "—"}
                      {job.customer_phone ? ` · ${job.customer_phone}` : ""}
                    </span>
                    <span>
                      {job.job_date ? (
                        <>
                          {formatDate(job.job_date)}
                          {job.job_time ? ` · ${formatTime(job.job_time)}` : ""}
                        </>
                      ) : (
                        "Esnek Tarih"
                      )}
                    </span>
                  </div>

                  <p className="text-right text-sm font-medium tabular-nums text-emerald-600">
                    {formatCurrency(job.amount)}
                    {job.commission_amount > 0 ? (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        Komisyon: {formatCurrency(job.commission_amount)}
                      </span>
                    ) : null}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Masaüstü: tablo */}
          <Card className="hidden gap-0 py-0 md:block">
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
                    <TableHead>Taşeron</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.job_date ? (
                        <>
                          {formatDate(job.job_date)}
                          {job.job_time ? (
                            <span className="mt-0.5 block text-xs">{formatTime(job.job_time)}</span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs">Esnek Tarih</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <Link href={`/ufo-temizlik/${job.id}`} className="hover:underline">
                        {ufoJobTypeLabel(job)}
                      </Link>
                    </TableCell>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {job.open_to_partners ? (
                        job.taken_by_partner_id ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal"
                          >
                            {job.taken_by_partner?.name ?? "Alındı"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 font-normal"
                          >
                            Havuzda
                          </Badge>
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <UfoJobRowActions job={job} />
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
