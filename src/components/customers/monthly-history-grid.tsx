import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthlyHistoryEntry, MonthlyHistoryStatus } from "@/lib/collections"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

const DURUM_STIL: Record<MonthlyHistoryStatus, string> = {
  odendi: "bg-emerald-50 border-emerald-200 text-emerald-700",
  kismi: "bg-sky-50 border-sky-200 text-sky-700",
  bekliyor: "bg-amber-50 border-amber-200 text-amber-700",
  gecikti: "bg-red-50 border-red-200 text-red-700",
  odenmedi: "bg-red-50 border-red-200 text-red-700",
  yok: "bg-muted border-transparent text-muted-foreground",
}

const DURUM_ETIKET: Record<MonthlyHistoryStatus, string> = {
  odendi: "Ödendi",
  kismi: "Kısmi",
  bekliyor: "Bekliyor",
  gecikti: "Gecikti",
  odenmedi: "Ödenmedi",
  yok: "—",
}

export function MonthlyHistoryGrid({ entries }: { entries: MonthlyHistoryEntry[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">Son {entries.length} Ay</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
        {entries.map((entry) => (
          <div
            key={`${entry.year}-${entry.month}`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center",
              DURUM_STIL[entry.status]
            )}
          >
            <span className="text-xs font-medium">{entry.label}</span>
            <span className="text-sm font-semibold tabular-nums">
              {entry.status === "yok" ? "—" : formatCurrency(entry.total)}
            </span>
            <span className="text-[11px]">{DURUM_ETIKET[entry.status]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
