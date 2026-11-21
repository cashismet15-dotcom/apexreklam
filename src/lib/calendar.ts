import { computeCollectionStatuses } from "@/lib/collections"
import type { Customer, FirmServiceWithFirm, Payment } from "@/lib/types"

export type CalendarEventStatus = "odendi" | "kismi" | "bekliyor" | "gecikti"

export interface CalendarEvent {
  id: string
  dateIso: string
  kind: "aylik" | "tek_seferlik"
  title: string
  amount: number
  /** Kısmi ödemede kalan tutar; diğerlerinde amount ile aynı. */
  remaining: number
  status: CalendarEventStatus
  href: string
}

export interface MonthSummary {
  expected: number
  collected: number
  remaining: number
  overdue: number
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function addDaysIso(iso: string, days: number): string {
  if (!days) return iso
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function monthBounds(year: number, month: number): { fromIso: string; toIso: string } {
  return {
    fromIso: `${year}-${pad2(month)}-01`,
    toIso: `${year}-${pad2(month)}-${pad2(daysInMonth(year, month))}`,
  }
}

/** "2026-11" → {year, month}; geçersizse bugünün ayı. */
export function parseMonthParam(value: string | undefined, today: Date): { year: number; month: number } {
  const m = value ? /^(\d{4})-(\d{2})$/.exec(value) : null
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2])
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) return { year, month }
  }
  return { year: today.getFullYear(), month: today.getMonth() + 1 }
}

export function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

/**
 * Bir ay için takvim olayları: aktif müşterilerin aylık vadeleri + vadesi o
 * aya düşen tek seferlik hizmetler.
 *
 * İçinde bulunduğumuz ay için durumlar Muhasebe'nin geri kalanıyla birebir aynı
 * olsun diye computeCollectionStatuses kullanılır (kapora, dondurma, ilk ödeme
 * tarihi dahil). Geçmiş/gelecek aylar ise o ayın ödeme kayıtlarından hesaplanır.
 */
export function buildMonthEvents(params: {
  year: number
  month: number
  todayIso: string
  customers: Customer[]
  payments: Payment[]
  oneTime: FirmServiceWithFirm[]
}): CalendarEvent[] {
  const { year, month, todayIso, customers, payments, oneTime } = params
  const { fromIso, toIso } = monthBounds(year, month)
  const isCurrentMonth = todayIso.slice(0, 7) === fromIso.slice(0, 7)
  const events: CalendarEvent[] = []

  const active = customers.filter((c) => c.status === "aktif")
  const currentStatuses = isCurrentMonth
    ? new Map(computeCollectionStatuses(active, payments).map((s) => [s.customer.id, s]))
    : null

  for (const customer of active) {
    const fee = Number(customer.monthly_fee)
    const href = customer.firm_id
      ? `/panel/firmalar/${customer.firm_id}`
      : `/muhasebe/musteriler/${customer.id}`

    const cyclePaid = payments
      .filter((p) => p.customer_id === customer.id && p.year === year && p.month === month)
      .reduce((acc, p) => acc + Number(p.amount), 0)

    let dueDate = addDaysIso(
      `${year}-${pad2(month)}-${pad2(Math.min(customer.payment_day, daysInMonth(year, month)))}`,
      customer.freeze_offset_days
    )

    const status = currentStatuses?.get(customer.id)
    if (status && status.cycleYear === year && status.cycleMonth === month && !status.isPaidThisMonth) {
      // Kapora kalanı için girilen tarih / ilk ödeme kuralı gibi düzeltmeler.
      dueDate = status.dueDate
    }

    // Tahsilat başlamadan önceki aylarda vade yok.
    if (dueDate < customer.start_date) continue
    if (dueDate < fromIso || dueDate > toIso) continue

    const remaining = Math.max(0, fee - cyclePaid)
    events.push({
      id: `c-${customer.id}`,
      dateIso: dueDate,
      kind: "aylik",
      title: customer.company_name,
      amount: fee,
      remaining,
      status:
        remaining <= 0 ? "odendi" : cyclePaid > 0 ? "kismi" : dueDate < todayIso ? "gecikti" : "bekliyor",
      href,
    })
  }

  for (const item of oneTime) {
    if (!item.due_date) continue
    events.push({
      id: `o-${item.id}`,
      dateIso: item.due_date,
      kind: "tek_seferlik",
      title: `${item.firm?.name ?? "Firma"} — ${item.name}`,
      amount: Number(item.price),
      remaining: item.paid_at ? 0 : Number(item.price),
      status: item.paid_at ? "odendi" : item.due_date < todayIso ? "gecikti" : "bekliyor",
      href: `/panel/firmalar/${item.firm_id}`,
    })
  }

  return events.sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.title.localeCompare(b.title, "tr"))
}

export function summarizeMonth(
  events: CalendarEvent[],
  payments: Payment[],
  year: number,
  month: number
): MonthSummary {
  const { fromIso, toIso } = monthBounds(year, month)
  // Tahsil edilen: o ay içinde gerçekten kasaya giren para (aylık ödemeler + tek seferlikler).
  const monthlyCollected = payments
    .filter((p) => p.payment_date >= fromIso && p.payment_date <= toIso)
    .reduce((acc, p) => acc + Number(p.amount), 0)
  const oneTimeCollected = events
    .filter((e) => e.kind === "tek_seferlik" && e.status === "odendi")
    .reduce((acc, e) => acc + e.amount, 0)

  return {
    expected: events.reduce((acc, e) => acc + e.amount, 0),
    collected: monthlyCollected + oneTimeCollected,
    remaining: events.reduce((acc, e) => acc + e.remaining, 0),
    overdue: events.filter((e) => e.status === "gecikti").reduce((acc, e) => acc + e.remaining, 0),
  }
}
