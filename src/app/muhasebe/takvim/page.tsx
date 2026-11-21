import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { MonthCalendar } from "@/components/muhasebe/month-calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { computeCollectionStatuses, type CustomerCollectionStatus } from "@/lib/collections"
import { buildMonthEvents, monthBounds, parseMonthParam, shiftMonth, summarizeMonth } from "@/lib/calendar"
import { getCustomers, getPayments } from "@/lib/data"
import { todayIso as getTodayIso } from "@/lib/daily-tracker"
import { getOneTimeServicesBetween, getUnpaidOneTimeServices } from "@/lib/firms-data"
import { AY_ADLARI, formatCurrency, formatDate, kalanGunEtiketi } from "@/lib/format"
import { cn } from "@/lib/utils"

function kalanGunBadgeClass(gun: number): string {
  if (gun < 0) return "bg-red-50 text-red-700 border-red-200"
  if (gun === 0) return "bg-amber-50 text-amber-700 border-amber-200"
  if (gun <= 3) return "bg-orange-50 text-orange-700 border-orange-200"
  return "bg-muted text-muted-foreground border-transparent"
}

function gunAnahtari(iso: string): string {
  return new Date(iso).toDateString()
}

function grupla(statuses: CustomerCollectionStatus[]): [string, CustomerCollectionStatus[]][] {
  const siralanmis = [...statuses].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  const gruplar = new Map<string, CustomerCollectionStatus[]>()
  for (const s of siralanmis) {
    const anahtar = gunAnahtari(s.dueDate)
    const mevcut = gruplar.get(anahtar) ?? []
    mevcut.push(s)
    gruplar.set(anahtar, mevcut)
  }
  return [...gruplar.entries()]
}

function GunGruplari({ gruplar }: { gruplar: [string, CustomerCollectionStatus[]][] }) {
  return (
    <div className="flex flex-col gap-4">
      {gruplar.map(([anahtar, kayitlar]) => {
        const ilkTarih = kayitlar[0].dueDate
        const gunToplam = kayitlar.reduce((acc, k) => acc + k.remainingThisMonth, 0)
        return (
          <div key={anahtar} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex shrink-0 flex-row items-baseline gap-2 pt-1 sm:w-40 sm:flex-col sm:items-start sm:gap-0.5">
              <span className="text-sm font-medium capitalize">{formatDate(ilkTarih)}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(gunToplam)} toplam
              </span>
            </div>
            <Card className="flex-1 gap-0 py-2">
              <CardContent className="flex flex-col divide-y px-0">
                {kayitlar.map((s) => (
                  <div
                    key={s.customer.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {s.customer.company_name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {s.customer.contact_name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(s.remainingThisMonth)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("font-normal", kalanGunBadgeClass(s.daysUntilDue))}
                      >
                        {kalanGunEtiketi(s.dueDate)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}


function daysFrom(fromIso: string, toIso: string): number {
  return Math.round((new Date(`${toIso}T00:00:00`).getTime() - new Date(`${fromIso}T00:00:00`).getTime()) / 86400000)
}

function Ozet({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-lg font-semibold tabular-nums", tone)}>{formatCurrency(value)}</span>
      </CardContent>
    </Card>
  )
}

export default async function TakvimPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>
}) {
  const { ay } = await searchParams
  const todayIso = getTodayIso()
  const { year, month } = parseMonthParam(ay, new Date(`${todayIso}T00:00:00`))
  const { fromIso, toIso } = monthBounds(year, month)

  const [customers, payments, oneTimeInMonth, unpaidOneTime] = await Promise.all([
    getCustomers(),
    getPayments(),
    getOneTimeServicesBetween(fromIso, toIso),
    getUnpaidOneTimeServices(),
  ])

  const events = buildMonthEvents({ year, month, todayIso, customers, payments, oneTime: oneTimeInMonth })
  const ozet = summarizeMonth(events, payments, year, month)
  const isCurrentMonth = todayIso.startsWith(fromIso.slice(0, 7))

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const bekleyenler = computeCollectionStatuses(customers, payments).filter(
    (s) => !s.isPaidThisMonth
  )

  const buAy = bekleyenler.filter((s) => {
    const d = new Date(s.dueDate)
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
  })
  const gelecekAy = bekleyenler.filter((s) => !buAy.includes(s))

  const buAyGruplari = grupla(buAy)
  const gelecekAyGruplari = grupla(gelecekAy)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Takvim"
        description="Aylık ve tek seferlik tahsilatlar — bir güne tıkla, o günün listesi sağda."
        actions={
          <div className="flex items-center gap-1">
            <Link
              href={`/muhasebe/takvim?ay=${shiftMonth(year, month, -1)}`}
              className="flex size-8 items-center justify-center rounded-md border hover:bg-muted"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="min-w-32 text-center text-sm font-semibold">
              {AY_ADLARI[month - 1]} {year}
            </span>
            <Link
              href={`/muhasebe/takvim?ay=${shiftMonth(year, month, 1)}`}
              className="flex size-8 items-center justify-center rounded-md border hover:bg-muted"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="size-4" />
            </Link>
            {!isCurrentMonth ? (
              <Link href="/muhasebe/takvim" className="ml-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                Bugün
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Ozet label="Beklenen" value={ozet.expected} />
        <Ozet label="Tahsil edilen" value={ozet.collected} tone="text-emerald-700 dark:text-emerald-400" />
        <Ozet label="Kalan" value={ozet.remaining} tone="text-amber-700 dark:text-amber-400" />
        <Ozet label="Geciken" value={ozet.overdue} tone={ozet.overdue > 0 ? "text-red-700 dark:text-red-400" : undefined} />
      </div>

      <MonthCalendar key={fromIso} year={year} month={month} todayIso={todayIso} events={events} />

      {unpaidOneTime.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Bekleyen Tek Seferlik Tahsilatlar</h2>
          <Card className="gap-0 py-2">
            <CardContent className="flex flex-col divide-y px-0">
              {unpaidOneTime.map((o) => (
                <Link
                  key={o.id}
                  href={`/panel/firmalar/${o.firm_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{o.firm?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{o.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(o.price)}</span>
                    {o.due_date ? (
                      <Badge variant="outline" className={cn("font-normal", kalanGunBadgeClass(daysFrom(todayIso, o.due_date)))}>
                        {kalanGunEtiketi(o.due_date)}
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <h2 className="-mb-2 text-base font-semibold">Bekleyen Aylık Tahsilatlar</h2>
      {bekleyenler.length === 0 ? (
        <Card className="py-10">
          <CardContent className="text-center text-sm text-muted-foreground">
            Herkes ödemesini yaptı.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Bu Ay</h2>
            {buAyGruplari.length === 0 ? (
              <Card className="py-6">
                <CardContent className="text-center text-sm text-muted-foreground">
                  Bu ay herkes ödemesini yaptı.
                </CardContent>
              </Card>
            ) : (
              <GunGruplari gruplar={buAyGruplari} />
            )}
          </div>

          {gelecekAyGruplari.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Gelecek Ay</h2>
              <GunGruplari gruplar={gelecekAyGruplari} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
