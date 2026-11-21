"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CalendarEvent, CalendarEventStatus } from "@/lib/calendar"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

const STATUS_LABEL: Record<CalendarEventStatus, string> = {
  odendi: "Ödendi",
  kismi: "Kısmi",
  bekliyor: "Bekliyor",
  gecikti: "Gecikti",
}

const STATUS_CHIP: Record<CalendarEventStatus, string> = {
  odendi: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  kismi: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
  bekliyor: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  gecikti: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
}

const STATUS_DOT: Record<CalendarEventStatus, string> = {
  odendi: "bg-emerald-500",
  kismi: "bg-sky-500",
  bekliyor: "bg-amber-500",
  gecikti: "bg-red-500",
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

const dayLongFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  weekday: "long",
})

export function MonthCalendar({
  year,
  month,
  todayIso,
  events,
}: {
  year: number
  month: number
  todayIso: string
  events: CalendarEvent[]
}) {
  const isCurrentMonth = todayIso.startsWith(`${year}-${pad2(month)}`)
  const firstEventDay = events[0]?.dateIso
  const [selected, setSelected] = useState<string>(
    isCurrentMonth ? todayIso : (firstEventDay ?? `${year}-${pad2(month)}-01`)
  )

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const list = map.get(e.dateIso) ?? []
      list.push(e)
      map.set(e.dateIso, list)
    }
    return map
  }, [events])

  // Pazartesi ile başlayan hafta ızgarası; ay dışı günler boş hücre.
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const leading = (first.getDay() + 6) % 7
    const total = new Date(year, month, 0).getDate()
    const list: (string | null)[] = Array(leading).fill(null)
    for (let d = 1; d <= total; d++) list.push(`${year}-${pad2(month)}-${pad2(d)}`)
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [year, month])

  const selectedEvents = byDay.get(selected) ?? []

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((iso, i) => {
            if (!iso) {
              return <div key={`e-${i}`} className="min-h-16 border-r border-b bg-muted/20 sm:min-h-24 [&:nth-child(7n)]:border-r-0" />
            }
            const dayEvents = byDay.get(iso) ?? []
            const isToday = iso === todayIso
            const isSelected = iso === selected
            const dayTotal = dayEvents.reduce((acc, e) => acc + e.remaining, 0)
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={cn(
                  "flex min-h-16 flex-col gap-1 border-r border-b p-1.5 text-left transition-colors hover:bg-muted/50 sm:min-h-24 [&:nth-child(7n)]:border-r-0",
                  isSelected && "bg-primary/5 ring-2 ring-primary ring-inset"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs",
                      isToday ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {Number(iso.slice(8))}
                  </span>
                  {dayTotal > 0 ? (
                    <span className="hidden text-[10px] font-medium tabular-nums text-muted-foreground sm:inline">
                      {formatCurrency(dayTotal)}
                    </span>
                  ) : null}
                </div>
                {/* Mobilde sadece renkli noktalar, geniş ekranda firma adları. */}
                <div className="flex flex-wrap gap-1 sm:hidden">
                  {dayEvents.map((e) => (
                    <span key={e.id} className={cn("size-1.5 rounded-full", STATUS_DOT[e.status])} />
                  ))}
                </div>
                <div className="hidden flex-col gap-0.5 sm:flex">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={cn("truncate rounded border px-1 py-0.5 text-[11px] leading-tight", STATUS_CHIP[e.status])}
                    >
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 ? (
                    <span className="text-[11px] text-muted-foreground">+{dayEvents.length - 3} daha</span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm capitalize">
            {dayLongFormatter.format(new Date(`${selected}T00:00:00`))}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu gün tahsilat yok.</p>
          ) : (
            selectedEvents.map((e) => (
              <Link
                key={e.id}
                href={e.href}
                className="flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{e.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.kind === "aylik" ? "Aylık" : "Tek seferlik"}
                    {e.status === "kismi" ? ` · kalan ${formatCurrency(e.remaining)}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(e.amount)}</span>
                  <span className={cn("rounded border px-1.5 text-[10px] font-medium", STATUS_CHIP[e.status])}>
                    {STATUS_LABEL[e.status]}
                  </span>
                </div>
              </Link>
            ))
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-[11px] text-muted-foreground">
            {(Object.keys(STATUS_LABEL) as CalendarEventStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
