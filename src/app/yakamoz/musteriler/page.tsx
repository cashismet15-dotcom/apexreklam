import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LogoutButton } from "@/components/auth/logout-button"
import { YakamozReminderButton } from "@/components/yakamoz/yakamoz-reminder-button"
import { getSessionRole } from "@/lib/auth-role"
import { getYakamozJobs } from "@/lib/yakamoz-data"
import { getYakamozContacts } from "@/lib/yakamoz-whatsapp-data"
import { getYakamozCustomerSummaries, phoneLast10 } from "@/lib/yakamoz"
import { formatDate } from "@/lib/format"

export default async function YakamozMusterilerPage() {
  const [jobs, contacts, session] = await Promise.all([
    getYakamozJobs(),
    getYakamozContacts(),
    getSessionRole(),
  ])

  const summaries = getYakamozCustomerSummaries(jobs)
  const contactByLast10 = new Map(contacts.map((c) => [phoneLast10(c.phone), c.id]))

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/yakamoz"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Yakamoz
        </Link>
        {session?.role === "owner" ? <LogoutButton /> : <span />}
      </div>

      <PageHeader
        title="Müşteriler"
        description={`${summaries.length} müşteri · hizmet almasının üzerinden 60+ gün geçenler hatırlatma için işaretlenir`}
      />

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y p-0">
          {summaries.length === 0 ? (
            <div className="flex h-24 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Henüz müşteri kaydı yok.
            </div>
          ) : (
            summaries.map((summary) => {
              const contactId = contactByLast10.get(phoneLast10(summary.phone))
              return (
                <div
                  key={summary.phone}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {summary.customer_name || summary.phone}
                      </span>
                      {summary.needsReminder ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 font-normal"
                        >
                          Hatırlatma Zamanı
                        </Badge>
                      ) : null}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {summary.phone} · {summary.totalJobs} hizmet
                      {summary.lastServiceDate
                        ? ` · son hizmet ${formatDate(summary.lastServiceDate)}`
                        : " · henüz tamamlanmış hizmet yok"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {contactId ? (
                      <Link
                        href={`/yakamoz/whatsapp/${contactId}`}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Konuşmayı Aç
                      </Link>
                    ) : null}
                    <YakamozReminderButton phone={summary.phone} customerName={summary.customer_name} />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
