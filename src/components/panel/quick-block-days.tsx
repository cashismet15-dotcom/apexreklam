"use client"

import { useState, useTransition } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { toggleBlockedDate } from "@/lib/actions/availability"

const WEEKDAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function nextDays(count: number): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return d
  })
}

/**
 * Elle tarih yazmadan, tek tıkla önümüzdeki 7 günden birini kapatıp açabilmek için —
 * "Haftalık Çalışma Saatleri" ile aynı görünümde ama sadece o güne özel (tek seferlik).
 */
export function QuickBlockDays({ blockedDates }: { blockedDates: string[] }) {
  const days = nextDays(7)
  const [blocked, setBlocked] = useState<Set<string>>(new Set(blockedDates))
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleToggle(dateStr: string, checked: boolean) {
    setPendingDate(dateStr)
    setBlocked((prev) => {
      const next = new Set(prev)
      if (checked) next.add(dateStr)
      else next.delete(dateStr)
      return next
    })
    startTransition(async () => {
      const result = await toggleBlockedDate(dateStr, checked)
      if (result.status === "error") {
        setBlocked((prev) => {
          const next = new Set(prev)
          if (checked) next.delete(dateStr)
          else next.add(dateStr)
          return next
        })
      }
      setPendingDate(null)
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col divide-y">
        {days.map((d, i) => {
          const dateStr = toDateStr(d)
          const isChecked = blocked.has(dateStr)
          const dayLabel = i === 0 ? "Bugün" : i === 1 ? "Yarın" : WEEKDAY_LABELS[d.getDay()]
          const dateLabel = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
          return (
            <label
              key={dateStr}
              className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={pendingDate === dateStr}
                  onChange={(e) => handleToggle(dateStr, e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
                {dayLabel}
              </span>
              <span className="text-muted-foreground">
                {dateLabel}
                {isChecked ? " — Kapalı" : ""}
              </span>
            </label>
          )
        })}
      </CardContent>
    </Card>
  )
}
