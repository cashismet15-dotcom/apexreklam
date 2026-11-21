import type { Firm, FirmPayment, FirmService } from "@/lib/types"

/**
 * Mühendis360 muhasebesi — eski işletmenin /muhasebe'sinden (customers/payments)
 * tamamen bağımsız. Aylık ücret = firmanın aylık hizmetlerinin toplamı; vade her
 * ayın firms.payment_day'i, ilk vade firms.billing_start. Alınan paralar firm_payments.
 */

export type CalendarEventStatus = "odendi" | "kismi" | "bekliyor" | "gecikti"

export interface CalendarEvent {
  id: string
  firmId: string
  dateIso: string
  kind: "aylik" | "tek_seferlik"
  title: string
  amount: number
  paid: number
  remaining: number
  status: CalendarEventStatus
  /** Aylık için "YYYY-MM" (Ödeme Al formunda kullanılır). */
  period: string | null
  href: string
}

export interface MonthSummary {
  expected: number
  collected: number
  remaining: number
  overdue: number
}

export interface BillingFirm {
  firm: Pick<Firm, "id" | "name" | "payment_day" | "billing_start">
  services: FirmService[]
  payments: FirmPayment[]
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function monthBounds(year: number, month: number): { fromIso: string; toIso: string } {
  return {
    fromIso: `${year}-${pad2(month)}-01`,
    toIso: `${year}-${pad2(month)}-${pad2(daysInMonth(year, month))}`,
  }
}

/** "2026-11" → {year, month}; geçersizse verilen günün ayı. */
export function parseMonthParam(value: string | undefined, todayIso: string): { year: number; month: number } {
  const m = value ? /^(\d{4})-(\d{2})$/.exec(value) : null
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2])
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) return { year, month }
  }
  return { year: Number(todayIso.slice(0, 4)), month: Number(todayIso.slice(5, 7)) }
}

export function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

/** Aylık hizmetlerin toplamı — firmanın Mühendis360 aylık ücreti. */
export function monthlyFeeOf(services: FirmService[]): number {
  return services.filter((s) => s.billing === "aylik").reduce((acc, s) => acc + Number(s.price), 0)
}

/** Firmanın verilen aydaki aylık vadesi; tahsilat başlamadıysa null. */
export function monthlyDueDate(
  firm: BillingFirm["firm"],
  year: number,
  month: number
): string | null {
  if (!firm.payment_day || !firm.billing_start) return null
  const due = `${year}-${pad2(month)}-${pad2(Math.min(firm.payment_day, daysInMonth(year, month)))}`
  // İlk ödeme ayı: vade, ilk ödeme tarihinin kendisi.
  if (firm.billing_start.slice(0, 7) === due.slice(0, 7)) return firm.billing_start
  return due < firm.billing_start ? null : due
}

function statusOf(remaining: number, paid: number, dueIso: string, todayIso: string): CalendarEventStatus {
  if (remaining <= 0) return "odendi"
  if (paid > 0) return "kismi"
  return dueIso < todayIso ? "gecikti" : "bekliyor"
}

export function buildMonthEvents(params: {
  year: number
  month: number
  todayIso: string
  firms: BillingFirm[]
}): CalendarEvent[] {
  const { year, month, todayIso, firms } = params
  const { fromIso, toIso } = monthBounds(year, month)
  const period = `${year}-${pad2(month)}`
  const events: CalendarEvent[] = []

  for (const { firm, services, payments } of firms) {
    const href = `/panel/firmalar/${firm.id}`

    const fee = monthlyFeeOf(services)
    const due = monthlyDueDate(firm, year, month)
    if (fee > 0 && due) {
      const paid = payments
        .filter((p) => p.period?.slice(0, 7) === period)
        .reduce((acc, p) => acc + Number(p.amount), 0)
      const remaining = Math.max(0, fee - paid)
      events.push({
        id: `m-${firm.id}-${period}`,
        firmId: firm.id,
        dateIso: due,
        kind: "aylik",
        title: firm.name,
        amount: fee,
        paid,
        remaining,
        status: statusOf(remaining, paid, due, todayIso),
        period,
        href,
      })
    }

    for (const s of services) {
      if (s.billing !== "tek_seferlik" || !s.due_date) continue
      if (s.due_date < fromIso || s.due_date > toIso) continue
      const price = Number(s.price)
      const paid = s.paid_at ? price : 0
      events.push({
        id: `o-${s.id}`,
        firmId: firm.id,
        dateIso: s.due_date,
        kind: "tek_seferlik",
        title: `${firm.name} — ${s.name}`,
        amount: price,
        paid,
        remaining: price - paid,
        status: statusOf(price - paid, 0, s.due_date, todayIso),
        period: null,
        href,
      })
    }
  }

  return events.sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.title.localeCompare(b.title, "tr"))
}

/** Ayın özeti. "Tahsil edilen" = o ay içinde gerçekten alınan para (ödeme tarihine göre). */
export function summarizeMonth(
  events: CalendarEvent[],
  firms: BillingFirm[],
  year: number,
  month: number,
  todayIso: string
): MonthSummary {
  const { fromIso, toIso } = monthBounds(year, month)
  const collected = firms
    .flatMap((f) => f.payments)
    .filter((p) => p.payment_date >= fromIso && p.payment_date <= toIso)
    .reduce((acc, p) => acc + Number(p.amount), 0)

  return {
    expected: events.reduce((acc, e) => acc + e.amount, 0),
    collected,
    remaining: events.reduce((acc, e) => acc + e.remaining, 0),
    // Vadesi geçmiş her kalan (kısmi ödenmiş olsa bile) gecikmiş sayılır.
    overdue: events.filter((e) => e.dateIso < todayIso).reduce((acc, e) => acc + e.remaining, 0),
  }
}

/**
 * Bugüne kadar vadesi gelmiş ama ödenmemiş her şey (önceki aylardan kalanlar
 * dahil) + bu ayın bekleyenleri — "Bekleyen Tahsilatlar" listesi için.
 */
export function outstandingEvents(firms: BillingFirm[], todayIso: string): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const [ty, tm] = [Number(todayIso.slice(0, 4)), Number(todayIso.slice(5, 7))]

  for (const bf of firms) {
    if (!bf.firm.billing_start) continue
    // İlk ödeme ayından bu aya kadar her ayı tara.
    let y = Number(bf.firm.billing_start.slice(0, 4))
    let m = Number(bf.firm.billing_start.slice(5, 7))
    while (y < ty || (y === ty && m <= tm)) {
      out.push(
        ...buildMonthEvents({ year: y, month: m, todayIso, firms: [{ ...bf, services: bf.services.filter((s) => s.billing === "aylik") }] })
      )
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
    // Tek seferlikler: ödenmemiş olanların hepsi (vadesi ne zaman olursa olsun).
    for (const s of bf.services) {
      if (s.billing !== "tek_seferlik" || s.paid_at || !s.due_date) continue
      const price = Number(s.price)
      out.push({
        id: `o-${s.id}`,
        firmId: bf.firm.id,
        dateIso: s.due_date,
        kind: "tek_seferlik",
        title: `${bf.firm.name} — ${s.name}`,
        amount: price,
        paid: 0,
        remaining: price,
        status: s.due_date < todayIso ? "gecikti" : "bekliyor",
        period: null,
        href: `/panel/firmalar/${bf.firm.id}`,
      })
    }
  }

  return out
    .filter((e) => e.remaining > 0)
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso))
}
