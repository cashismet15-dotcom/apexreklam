import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { ContentNotesDialog } from "@/components/content/content-notes-dialog"
import { ContentWeekButton } from "@/components/content/content-week-button"
import { LogoUpload } from "@/components/content/logo-upload"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_STYLE, currentWeekStartIso } from "@/lib/content"
import { getContentWeeksForCustomer, getCustomerById } from "@/lib/data"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default async function IcerikDanisanDetayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  const weekStart = currentWeekStartIso()
  const history = await getContentWeeksForCustomer(id)
  const currentWeek = history.find((w) => w.week_start === weekStart) ?? null
  const pastWeeks = history.filter((w) => w.week_start !== weekStart)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/icerik-takip"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Danışanlara dön
      </Link>

      <PageHeader
        title={customer.company_name}
        description={`${customer.contact_name} · ${customer.phone}`}
        actions={
          <ContentWeekButton
            customerId={customer.id}
            companyName={customer.company_name}
            weekStart={weekStart}
            currentWeek={currentWeek}
            variant="default"
            label="Bu Haftayı Güncelle"
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoUpload
              customerId={customer.id}
              companyName={customer.company_name}
              logoUrl={customer.logo_url}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Kalıcı Talimatlar</CardTitle>
            <ContentNotesDialog
              customerId={customer.id}
              companyName={customer.company_name}
              notes={customer.content_notes}
            />
          </CardHeader>
          <CardContent>
            {customer.content_notes ? (
              <p className="text-sm whitespace-pre-wrap">{customer.content_notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Henüz kalıcı talimat girilmedi. Bu danışan için her hafta geçerli olan
                notları buraya ekleyebilirsiniz.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-4">
          <CardTitle className="text-base font-semibold">
            Bu Hafta ({formatDate(weekStart)})
          </CardTitle>
          {currentWeek ? (
            <Badge
              variant="outline"
              className={cn("font-normal", CONTENT_STATUS_STYLE[currentWeek.status])}
            >
              {CONTENT_STATUS_LABEL[currentWeek.status]}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="font-normal bg-muted text-muted-foreground border-transparent"
            >
              Henüz başlanmadı
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 py-4">
          {currentWeek?.note ? (
            <p className="text-sm whitespace-pre-wrap">{currentWeek.note}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Bu hafta için henüz not girilmedi.</p>
          )}
          {currentWeek?.video_url ? (
            <a
              href={currentWeek.video_url}
              target="_blank"
              rel="noreferrer"
              className="w-fit text-sm text-primary hover:underline"
            >
              Video linkini aç →
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base font-semibold">Geçmiş Haftalar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y px-0">
          {pastWeeks.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Henüz geçmiş kayıt yok.</p>
          ) : (
            pastWeeks.map((week) => (
              <div key={week.id} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{formatDate(week.week_start)}</span>
                  <Badge
                    variant="outline"
                    className={cn("font-normal", CONTENT_STATUS_STYLE[week.status])}
                  >
                    {CONTENT_STATUS_LABEL[week.status]}
                  </Badge>
                </div>
                {week.note ? (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {week.note}
                  </p>
                ) : null}
                {week.video_url ? (
                  <a
                    href={week.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit text-xs text-primary hover:underline"
                  >
                    Video linkini aç →
                  </a>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
