import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getUfoJobs } from "@/lib/ufo-data"
import { UFO_STATUS_LABELS, buildMonthGrid, groupUfoJobsByDate, ufoJobTypeLabel } from "@/lib/ufo"
import { AY_ADLARI, formatDate, formatTime } from "@/lib/format"
import type { UfoJobStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

const STATUS_BADGE_CLASS: Record<UfoJobStatus, string> = {
  bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  tamamlandi: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iptal: "bg-red-50 text-red-700 border-red-200",
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function monthParam(year: number, month: number): string {
  return `${year}-${pad2(month)}`
}

export default async function UfoTakvimPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string; gun?: string }>
}) {
  const { ay, gun } = await searchParams
  const now = new Date()
  const [year, month] =
    ay && /^\d{4}-\d{2}$/.test(ay)
      ? ay.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1]

  const jobs = await getUfoJobs()
  const byDate = groupUfoJobsByDate(jobs)
  const gridDates = buildMonthGrid(year, month)

  const currentAy = monthParam(year, month)
  const prevDate = new Date(year, month - 2, 1)
  const nextDate = new Date(year, month, 1)
  const prevAy = monthParam(prevDate.getFullYear(), prevDate.getMonth() + 1)
  const nextAy = monthParam(nextDate.getFullYear(), nextDate.getMonth() + 1)

  const monthPrefix = `${year}-${pad2(month)}`
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  const selectedJobs = gun ? (byDate.get(gun) ?? []) : []

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/ufo-temizlik"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Ufo Temizlik&apos;e dön
        </Link>
        <LogoutButton />
      </div>

      <PageHeader title="Takvim" description="İş ve randevuları tarihe göre görüntüle." />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/ufo-temizlik/takvim?ay=${prevAy}`}
              className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="text-sm font-semibold">
              {AY_ADLARI[month - 1]} {year}
            </span>
            <Link
              href={`/ufo-temizlik/takvim?ay=${nextAy}`}
              className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
            {gridDates.map((date) => {
              const dayJobs = byDate.get(date) ?? []
              const inMonth = date.startsWith(monthPrefix)
              const isToday = date === todayIso
              const isSelected = date === gun
              const dayNumber = Number(date.slice(8, 10))

              return (
                <Link
                  key={date}
                  href={`/ufo-temizlik/takvim?ay=${currentAy}&gun=${date}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-sm transition-colors hover:border-primary/50",
                    inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                    isSelected ? "border-primary" : "border-transparent",
                    isToday && !isSelected ? "text-primary font-semibold" : ""
                  )}
                >
                  <span>{dayNumber}</span>
                  {dayJobs.length > 0 ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {dayJobs.length}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {gun ? (
        <Card className="gap-0 py-0">
          <CardContent className="flex flex-col divide-y p-0">
            {selectedJobs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {formatDate(gun)} için kayıt yok.
              </div>
            ) : (
              selectedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/ufo-temizlik/${job.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{ufoJobTypeLabel(job)}</span>
                    <span className="text-xs text-muted-foreground">
                      {job.job_time ? formatTime(job.job_time) : "Saat belirtilmemiş"}
                      {job.customer_name ? ` · ${job.customer_name}` : ""}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      job.record_type === "randevu"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-normal"
                        : `font-normal ${STATUS_BADGE_CLASS[job.status]}`
                    }
                  >
                    {job.record_type === "randevu" ? "Randevu" : UFO_STATUS_LABELS[job.status]}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
