import Link from "next/link"
import { UserRound } from "lucide-react"

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
import { TakeJobButton } from "@/components/taseron/take-job-button"
import { getSessionRole } from "@/lib/auth-role"
import { getPartnerJobs } from "@/lib/partner-data"
import { ufoJobTypeLabel } from "@/lib/ufo"
import { formatCurrency, formatDate, formatTime } from "@/lib/format"
import type { PartnerJob } from "@/lib/types"

function JobStatusBadge({ job, companyId }: { job: PartnerJob; companyId?: string }) {
  const isTakenByMe = job.taken_by_partner_id === companyId
  const isTaken = job.taken_by_partner_id != null

  if (isTakenByMe) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
        Sen Aldın
      </Badge>
    )
  }
  if (isTaken) {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Alındı
      </Badge>
    )
  }
  return <TakeJobButton jobId={job.id} />
}

export default async function TaseronPage() {
  const [jobs, session] = await Promise.all([getPartnerJobs(), getSessionRole()])
  const companyId = session?.companyId

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" asChild>
          <Link href="/taseron/profil">
            <UserRound />
            Profilim
          </Link>
        </Button>
        <LogoutButton />
      </div>

      <PageHeader
        title="İş Havuzu"
        description="Ufo Temizlik'in alt firmalara açtığı işler — sadece konum ve tutarı görürsünüz."
      />

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Şu anda havuzda iş yok.
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
                      <p className="text-sm font-medium">{ufoJobTypeLabel(job)}</p>
                      <p className="text-xs text-muted-foreground">{job.home_type ?? "—"}</p>
                    </div>
                    <p className="text-sm font-medium tabular-nums text-emerald-600">
                      {formatCurrency(job.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{job.location || "—"}</span>
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
                  <div className="flex justify-end">
                    <JobStatusBadge job={job} companyId={companyId} />
                  </div>
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
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="w-32" />
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
                      <TableCell className="text-sm font-medium">{ufoJobTypeLabel(job)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.home_type ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.location || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums text-emerald-600">
                        {formatCurrency(job.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <JobStatusBadge job={job} companyId={companyId} />
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
