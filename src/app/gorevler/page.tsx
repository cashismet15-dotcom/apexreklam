import Link from "next/link"
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, FileText } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { PageHeader } from "@/components/layout/page-header"
import { AddPersonButton } from "@/components/daily-tasks/add-person-button"
import { PersonCard } from "@/components/daily-tasks/person-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { addDaysIso, formatDayLabel, todayIso } from "@/lib/daily-tracker"
import { getDailyTaskBoard } from "@/lib/daily-tasks-data"
import { cn } from "@/lib/utils"

const RANGE_DAYS = 3

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
}

export default async function GorevlerPage({
  searchParams,
}: {
  searchParams: Promise<{ tarih?: string }>
}) {
  const { tarih } = await searchParams
  const today = todayIso()
  const center = tarih && isValidIsoDate(tarih) ? tarih : today
  const dates = [addDaysIso(center, -1), center, addDaysIso(center, 1)]

  const board = await getDailyTaskBoard(dates)
  const prevCenter = addDaysIso(center, -RANGE_DAYS)
  const nextCenter = addDaysIso(center, RANGE_DAYS)
  const showsToday = dates.includes(today)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Ana sayfaya dön
        </Link>
        <LogoutButton />
      </div>

      <PageHeader
        title="Günlük Görevler"
        description={
          board.totalOverdue > 0
            ? `${board.totalOverdue} görev süresinde tamamlanmadı.`
            : "Personel ve senin için günlük görev listesi."
        }
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/gorevler/dokumanlar">
                <FileText />
                Dökümanlar
              </Link>
            </Button>
            <AddPersonButton />
          </>
        }
      />

      <Card size="sm">
        <CardContent className="flex items-center justify-between gap-3">
          <Link
            href={`/gorevler?tarih=${prevCenter}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Önceki günler</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            {dates.map((date) => (
              <span
                key={date}
                className={cn(
                  "rounded-full px-2.5 py-1 capitalize",
                  date === today ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                {formatDayLabel(date)}
              </span>
            ))}
            {!showsToday ? (
              <Link
                href="/gorevler"
                className="text-xs font-normal text-primary underline-offset-4 hover:underline"
              >
                Bugüne dön
              </Link>
            ) : null}
          </div>

          <Link
            href={`/gorevler?tarih=${nextCenter}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Sonraki günler</span>
          </Link>
        </CardContent>
      </Card>

      {board.people.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">Henüz kişi eklenmedi.</p>
            <AddPersonButton />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {board.people.map((boardPerson) => (
            <PersonCard key={boardPerson.person.id} boardPerson={boardPerson} dates={dates} todayDate={today} />
          ))}
        </div>
      )}
    </div>
  )
}
