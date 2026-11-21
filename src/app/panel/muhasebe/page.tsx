import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { FirmPaymentList, RecordPaymentButton } from "@/components/muhasebe/firm-payments"
import { MonthCalendar } from "@/components/muhasebe/month-calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import {
  buildMonthEvents,
  monthBounds,
  monthlyFeeOf,
  outstandingEvents,
  parseMonthParam,
  shiftMonth,
  summarizeMonth,
} from "@/lib/calendar"
import { todayIso as getTodayIso } from "@/lib/daily-tracker"
import { getBillingFirms } from "@/lib/firms-data"
import { AY_ADLARI, formatCurrency, formatDate } from "@/lib/format"
import { toTeamRole } from "@/lib/panel"
import { cn } from "@/lib/utils"

function Ozet({ label, value, tone, hint }: { label: string; value: number; tone?: string; hint?: string }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-lg font-semibold tabular-nums", tone)}>{formatCurrency(value)}</span>
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  )
}

export default async function Muhendis360MuhasebePage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>
}) {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  // Tutarlar sadece owner'da görünüyor.
  if (role !== "owner") notFound()

  const { ay } = await searchParams
  const today = getTodayIso()
  const { year, month } = parseMonthParam(ay, today)
  const { fromIso } = monthBounds(year, month)
  const isCurrentMonth = today.startsWith(fromIso.slice(0, 7))

  const firms = await getBillingFirms()
  const events = buildMonthEvents({ year, month, todayIso: today, firms })
  const ozet = summarizeMonth(events, firms, year, month, today)

  const mrr = firms.reduce((acc, f) => acc + monthlyFeeOf(f.services), 0)
  const activeCount = firms.filter((f) => monthlyFeeOf(f.services) > 0).length

  // Vadesi gelmiş/geçmiş + bu ay içinde vadesi gelecek ödenmemişler.
  const { toIso: thisMonthEnd } = monthBounds(Number(today.slice(0, 4)), Number(today.slice(5, 7)))
  const bekleyenler = outstandingEvents(firms, today).filter((e) => e.dateIso <= thisMonthEnd)
  const firmNames = Object.fromEntries(firms.map((f) => [f.firm.id, f.firm.name]))
  const recentPayments = firms
    .flatMap((f) => f.payments)
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 15)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Muhasebe"
        description="Mühendis360 tahsilatları — firmaların aylık ve tek seferlik ödemeleri."
        actions={
          <div className="flex items-center gap-1">
            <Link
              href={`/panel/muhasebe?ay=${shiftMonth(year, month, -1)}`}
              className="flex size-8 items-center justify-center rounded-md border hover:bg-muted"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="min-w-32 text-center text-sm font-semibold">
              {AY_ADLARI[month - 1]} {year}
            </span>
            <Link
              href={`/panel/muhasebe?ay=${shiftMonth(year, month, 1)}`}
              className="flex size-8 items-center justify-center rounded-md border hover:bg-muted"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="size-4" />
            </Link>
            {!isCurrentMonth ? (
              <Link href="/panel/muhasebe" className="ml-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                Bugün
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Ozet label="Aylık gelir (MRR)" value={mrr} hint={`${activeCount} aktif firma`} />
        <Ozet label="Bu ay beklenen" value={ozet.expected} />
        <Ozet label="Tahsil edilen" value={ozet.collected} tone="text-emerald-700 dark:text-emerald-400" />
        <Ozet label="Kalan" value={ozet.remaining} tone="text-amber-700 dark:text-amber-400" />
        <Ozet
          label="Geciken"
          value={ozet.overdue}
          tone={ozet.overdue > 0 ? "text-red-700 dark:text-red-400" : undefined}
        />
      </div>

      {firms.length === 0 ? (
        <Card>
          <CardContent className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
            Henüz hizmet alan firma yok — bir firmayı &quot;Olumlu — Müşteri Yap&quot; ile müşteriye çevirince burada görünür.
          </CardContent>
        </Card>
      ) : null}

      <MonthCalendar key={fromIso} year={year} month={month} todayIso={today} events={events} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bekleyen Tahsilatlar {bekleyenler.length > 0 ? `(${bekleyenler.length})` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {bekleyenler.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bekleyen tahsilat yok.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {bekleyenler.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-2.5">
                    <Link href={e.href} className="flex min-w-0 flex-1 flex-col hover:underline">
                      <span className="truncate text-sm font-medium">{e.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.kind === "aylik" ? "Aylık" : "Tek seferlik"} · {formatDate(e.dateIso)}
                        {e.paid > 0 ? ` · ${formatCurrency(e.paid)} alındı` : ""}
                      </span>
                    </Link>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(e.remaining)}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-normal",
                        e.status === "gecikti"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      )}
                    >
                      {e.status === "gecikti" ? "Gecikti" : e.status === "kismi" ? "Kısmi" : "Bekliyor"}
                    </Badge>
                    {e.kind === "aylik" && e.period ? (
                      <RecordPaymentButton
                        variant="outline"
                        firmId={e.firmId}
                        firmName={e.title}
                        defaultAmount={e.remaining}
                        defaultPeriod={e.period}
                        todayIso={today}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <FirmPaymentList payments={recentPayments} firmNames={firmNames} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
