import Link from "next/link"
import { ArrowLeft, Send, Sparkles } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "@/components/auth/logout-button"
import { NewYakamozSpecialDayButton } from "@/components/yakamoz/new-yakamoz-special-day-button"
import { YakamozSpecialDayRowActions } from "@/components/yakamoz/yakamoz-special-day-row-actions"
import { YakamozSpecialDaySendButton } from "@/components/yakamoz/yakamoz-special-day-send-button"
import { getYakamozBroadcasts, getYakamozSpecialDays, getYakamozTemplates } from "@/lib/yakamoz-broadcast-data"
import { daysUntilNextOccurrence } from "@/lib/yakamoz"
import { formatDate, AY_ADLARI } from "@/lib/format"

// "Bugün" hesaplaması güncel tarihe bağlı — statik prerender'da build anına kilitlenmesin.
export const dynamic = "force-dynamic"

export default async function YakamozHaberlesmePage() {
  const [specialDays, templates, broadcasts] = await Promise.all([
    getYakamozSpecialDays(),
    getYakamozTemplates(),
    getYakamozBroadcasts(),
  ])

  const sortedSpecialDays = [...specialDays].sort(
    (a, b) => daysUntilNextOccurrence(a.month, a.day) - daysUntilNextOccurrence(b.month, b.day)
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Ana Sayfa
        </Link>
        <LogoutButton />
      </div>

      <PageHeader
        title="Yakamoz Haberleşme"
        description="Şablonlar, özel gün takvimi ve toplu WhatsApp mesajları."
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href="/yakamoz-haberlesme/sablonlar">Şablonlar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/yakamoz-haberlesme/gonder">
                <Send />
                Toplu Mesaj Gönder
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-muted-foreground" />
            Özel Günler
          </CardTitle>
          <NewYakamozSpecialDayButton templates={templates} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sortedSpecialDays.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Henüz özel gün eklenmedi.</p>
          ) : (
            sortedSpecialDays.map((specialDay) => {
              const daysUntil = daysUntilNextOccurrence(specialDay.month, specialDay.day)
              const isToday = daysUntil === 0
              const sentThisYear = specialDay.last_sent_year === new Date().getFullYear() && isToday
              return (
                <div
                  key={specialDay.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                    isToday ? "border-emerald-300 bg-emerald-50" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{specialDay.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {specialDay.day} {AY_ADLARI[specialDay.month - 1]}
                      {isToday ? " · Bugün" : ` · ${daysUntil} gün kaldı`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isToday ? (
                      sentThisYear ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
                          Bu yıl gönderildi
                        </Badge>
                      ) : (
                        <YakamozSpecialDaySendButton id={specialDay.id} title={specialDay.title} />
                      )
                    ) : null}
                    <YakamozSpecialDayRowActions specialDay={specialDay} templates={templates} />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base font-semibold">Son Gönderimler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y p-0">
          {broadcasts.length === 0 ? (
            <div className="flex h-20 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Henüz toplu gönderim yapılmadı.
            </div>
          ) : (
            broadcasts.map((broadcast) => (
              <div key={broadcast.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {broadcast.title || broadcast.body.slice(0, 60)}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(broadcast.created_at)}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {broadcast.success_count}/{broadcast.recipient_count} başarılı
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
