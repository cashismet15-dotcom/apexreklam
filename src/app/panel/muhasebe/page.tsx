import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { FirmPaymentList, RecordPaymentButton } from "@/components/muhasebe/firm-payments"
import { MonthCalendar } from "@/components/muhasebe/month-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import {
  buildMonthEvents,
  debtsByFirm,
  monthBounds,
  monthlyFeeOf,
  parseMonthParam,
  paymentOptionsFor,
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

  const debts = debtsByFirm(firms, today)
  const totalDebt = debts.reduce((acc, d) => acc + d.overdue + d.upcoming, 0)
  const totalOverdueDebt = debts.reduce((acc, d) => acc + d.overdue, 0)

  const firmNames = Object.fromEntries(firms.map((f) => [f.firm.id, f.firm.name]))
  const serviceNames = Object.fromEntries(firms.flatMap((f) => f.services.map((s) => [s.id, s.name])))
  const recentPayments = firms
    .flatMap((f) => f.payments)
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 15)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Muhasebe"
        description="Mühendis360 tahsilatları — firmaların aylık ve tek seferlik ödemeleri, kalan borçlar."
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
        <Ozet label={`${AY_ADLARI[month - 1]} beklenen`} value={ozet.expected} />
        <Ozet label="Tahsil edilen" value={ozet.collected} tone="text-emerald-700 dark:text-emerald-400" />
        <Ozet
          label="Toplam borç"
          value={totalDebt}
          tone={totalDebt > 0 ? "text-amber-700 dark:text-amber-400" : undefined}
          hint={`${debts.length} firma`}
        />
        <Ozet
          label="Vadesi geçmiş borç"
          value={totalOverdueDebt}
          tone={totalOverdueDebt > 0 ? "text-red-700 dark:text-red-400" : undefined}
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
            <CardTitle className="text-sm">Borçlu Firmalar {debts.length > 0 ? `(${debts.length})` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {debts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Borcu olan firma yok.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {debts.map((d) => {
                  const bf = firms.find((f) => f.firm.id === d.firmId)
                  return (
                    <div key={d.firmId} className="flex flex-col gap-2 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col">
                          <Link href={`/panel/firmalar/${d.firmId}`} className="truncate text-sm font-semibold hover:underline">
                            {d.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {d.overdue > 0 ? (
                              <span className="text-red-700 dark:text-red-400">
                                {formatCurrency(d.overdue)} gecikmiş
                                {d.oldestOverdue ? ` · en eskisi ${formatDate(d.oldestOverdue)}` : ""}
                              </span>
                            ) : null}
                            {d.overdue > 0 && d.upcoming > 0 ? " · " : ""}
                            {d.upcoming > 0 ? `${formatCurrency(d.upcoming)} vadesi gelmemiş` : ""}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(d.overdue + d.upcoming)}
                          </span>
                          <RecordPaymentButton
                            variant="outline"
                            firmId={d.firmId}
                            firmName={d.name}
                            options={paymentOptionsFor(d.items)}
                            hasMonthly={bf ? monthlyFeeOf(bf.services) > 0 : false}
                            todayIso={today}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {d.items.map((e) => (
                          <span
                            key={e.id}
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[11px]",
                              e.dateIso < today
                                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                            )}
                          >
                            {e.label}: {formatCurrency(e.remaining)}
                            {e.dateIso !== e.originalDateIso ? ` (söz ${formatDate(e.dateIso)})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <FirmPaymentList payments={recentPayments} firmNames={firmNames} serviceNames={serviceNames} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
