import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UfoJobDetailActions } from "@/components/ufo/ufo-job-detail-actions"
import { getUfoJobById } from "@/lib/ufo-data"
import {
  UFO_CATEGORY_LABELS,
  UFO_RECORD_TYPE_LABELS,
  UFO_STATUS_LABELS,
  ufoJobTypeLabel,
} from "@/lib/ufo"
import { formatCurrency, formatDate, formatTime } from "@/lib/format"

const STATUS_BADGE_CLASS = {
  bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  tamamlandi: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iptal: "bg-red-50 text-red-700 border-red-200",
} as const

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default async function UfoJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getUfoJobById(id)
  if (!job) notFound()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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

      <PageHeader
        title={ufoJobTypeLabel(job)}
        description={
          job.record_type === "randevu"
            ? "Randevu"
            : `İş · ${UFO_STATUS_LABELS[job.status]}`
        }
        actions={<UfoJobDetailActions job={job} />}
      />

      <Card>
        <CardContent className="flex flex-col">
          <DetailRow
            label="Tip"
            value={
              <Badge
                variant="outline"
                className={
                  job.record_type === "randevu"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-normal"
                    : `font-normal ${STATUS_BADGE_CLASS[job.status]}`
                }
              >
                {job.record_type === "randevu"
                  ? UFO_RECORD_TYPE_LABELS.randevu
                  : UFO_STATUS_LABELS[job.status]}
              </Badge>
            }
          />
          <DetailRow label="Kategori" value={UFO_CATEGORY_LABELS[job.category]} />
          {job.home_type ? <DetailRow label="Ev Tipi" value={job.home_type} /> : null}
          <DetailRow label="Konum" value={job.location || "—"} />
          <DetailRow label="Müşteri" value={job.customer_name || "—"} />
          <DetailRow label="Telefon" value={job.customer_phone || "—"} />
          <DetailRow
            label="Tarih"
            value={job.job_date ? formatDate(job.job_date) : "Esnek Tarih"}
          />
          {job.job_time ? <DetailRow label="Saat" value={formatTime(job.job_time)} /> : null}
          <DetailRow label="Tutar" value={formatCurrency(job.amount)} />
          {job.commission_amount > 0 ? (
            <DetailRow label="Komisyon Tutarı" value={formatCurrency(job.commission_amount)} />
          ) : null}
          {job.note ? (
            <div className="flex flex-col gap-1 pt-3">
              <span className="text-sm text-muted-foreground">Not</span>
              <span className="text-sm whitespace-pre-wrap">{job.note}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
