"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthlyRevenueEntry } from "@/lib/collections"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RevenueChart({ entries }: { entries: MonthlyRevenueEntry[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(1, ...entries.map((e) => e.total))
  const hasData = entries.some((e) => e.total > 0)

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">
          Aylık Tahsilat Trendi (Son {entries.length} Ay)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {hasData ? (
          <div className="flex h-40 items-end gap-3">
            {entries.map((entry, i) => {
              const heightPct = entry.total === 0 ? 2 : Math.max(4, (entry.total / max) * 100)
              const isHovered = hovered === i
              return (
                <div
                  key={`${entry.year}-${entry.month}`}
                  className="relative flex h-full flex-1 flex-col items-center justify-end gap-2"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {isHovered ? (
                    <div className="absolute -top-2 z-10 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-sm">
                      {formatCurrency(entry.total)}
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-colors",
                      isHovered ? "bg-emerald-600" : "bg-emerald-500/80"
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      isHovered ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {entry.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Henüz tahsilat kaydı yok.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
