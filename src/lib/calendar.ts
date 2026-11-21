import type { Firm, FirmPayment, FirmService } from "@/lib/types"

/**
 * Mühendis360 muhasebesi — eski işletmenin /muhasebe'sinden (customers/payments)
 * tamamen bağımsız. Aylık ücret = firmanın aylık hizmetlerinin toplamı; vade her
 * ayın firms.payment_day'i, ilk vade firms.billing_start. Alınan paralar firm_payments.
 *
 * Borç: bir ayın ücreti ya da tek seferlik hizmet parça parça ödenebilir. Kalan
 * tutar ödenene kadar borç olarak durur; kısmi ödemede "kalan için söz verilen
 * tarih" girildiyse vade o tarihe kayar.
 */

export type CalendarEventStatus = "odendi" | "kismi" | "bekliyor" | "gecikti"

export interface CalendarEvent {
  id: string
  firmId: string
  /** Güncel vade — söz verilen tarih girildiyse o tarih. */
  dateIso: string
  /** Asıl vade (söz verilen tarih yoksa dateIso ile aynı). */
  originalDateIso: string
  kind: "aylik" | "tek_seferlik"
  title: string
  /** Kısa etiket: "Kasım 2026 ücreti" ya da hizmet adı. */
  label: string
  amount: number
  paid: number
  remaining: number
  status: CalendarEventStatus
  /** Aylık için "YYYY-MM". */
  period: string | null
  /** Tek seferlik için hizmet id'si. */
  firmServiceId: string | null
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

const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function periodLabel(period: string): string {
  return `${AYLAR[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`
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
export function monthlyDueDate(firm: BillingFirm["firm"], year: number, month: number): string | null {
  if (!firm.payment_day || !firm.billing_start) return null
  const due = `${year}-${pad2(month)}-${pad2(Math.min(firm.payment_day, daysInMonth(year, month)))}`
  // İlk ödeme ayı: vade, ilk ödeme tarihinin kendisi.
  if (firm.billing_start.slice(0, 7) === due.slice(0, 7)) return firm.billing_start
  return due < firm.billing_start ? null : due
}

/** Bir kalemin ödemelerinden: ödenen, kalan, (varsa) en son söz verilen tarih. */
function settle(amount: number, itemPayments: FirmPayment[]) {
  const paid = itemPayments.reduce((acc, p) => acc + Number(p.amount), 0)
  const remaining = Math.max(0, Math.round((amount - paid) * 100) / 100)
  let promised: string | null = null
  for (const p of itemPayments) {
    if (p.expected_remaining_date && (!promised || p.expected_remaining_date > promised)) {
      promised = p.expected_remaining_date
    }
  }
  return { paid, remaining, promised: remaining > 0 ? promised : null }
}

function statusOf(remaining: number, paid: number, dueIso: string, todayIso: string): CalendarEventStatus {
  if (remaining <= 0) return "odendi"
  if (dueIso < todayIso) return "gecikti"
  return paid > 0 ? "kismi" : "bekliyor"
}

/**
 * Bir firmanın tüm kalemleri: ilk ödeme ayından `untilPeriod` ("YYYY-MM") ayına
 * kadar her ayın ücreti + tüm tek seferlik hizmetler.
 */
function firmEvents(bf: BillingFirm, todayIso: string, untilPeriod: string): CalendarEvent[] {
  const { firm, services, payments } = bf
  const href = `/panel/firmalar/${firm.id}`
  const events: CalendarEvent[] = []

  const fee = monthlyFeeOf(services)
  if (fee > 0 && firm.billing_start) {
    let y = Number(firm.billing_start.slice(0, 4))
    let m = Number(firm.billing_start.slice(5, 7))
    while (`${y}-${pad2(m)}` <= untilPeriod) {
      const period = `${y}-${pad2(m)}`
      const due = monthlyDueDate(firm, y, m)
      if (due) {
        const s = settle(fee, payments.filter((p) => p.period?.slice(0, 7) === period))
        const dateIso = s.promised ?? due
        events.push({
          id: `m-${firm.id}-${period}`,
          firmId: firm.id,
          dateIso,
          originalDateIso: due,
          kind: "aylik",
          title: firm.name,
          label: `${periodLabel(period)} ücreti`,
          amount: fee,
          paid: s.paid,
          remaining: s.remaining,
          status: statusOf(s.remaining, s.paid, dateIso, todayIso),
          period,
          firmServiceId: null,
          href,
        })
      }
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
  }

  for (const svc of services) {
    if (svc.billing !== "tek_seferlik" || !svc.due_date) continue
    const price = Number(svc.price)
    const s = settle(price, payments.filter((p) => p.firm_service_id === svc.id))
    const dateIso = s.promised ?? svc.due_date
    events.push({
      id: `o-${svc.id}`,
      firmId: firm.id,
      dateIso,
      originalDateIso: svc.due_date,
      kind: "tek_seferlik",
      title: `${firm.name} — ${svc.name}`,
      label: svc.name,
      amount: price,
      paid: s.paid,
      remaining: s.remaining,
      status: statusOf(s.remaining, s.paid, dateIso, todayIso),
      period: null,
      firmServiceId: svc.id,
      href,
    })
  }

  return events
}

function byDate(a: CalendarEvent, b: CalendarEvent): number {
  return a.dateIso.localeCompare(b.dateIso) || a.title.localeCompare(b.title, "tr")
}

/** Takvimde o ay görünecek kalemler (söz verilen tarihi bu aya kayanlar dahil). */
export function buildMonthEvents(params: {
  year: number
  month: number
  todayIso: string
  firms: BillingFirm[]
}): CalendarEvent[] {
  const { year, month, todayIso, firms } = params
  const { fromIso, toIso } = monthBounds(year, month)
  const until = `${year}-${pad2(month)}`
  return firms
    .flatMap((bf) => firmEvents(bf, todayIso, until))
    .filter((e) => e.dateIso >= fromIso && e.dateIso <= toIso)
    .sort(byDate)
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
    // Önceki aydan bu aya söz verilerek kayan borçlar sadece kalan tutarıyla sayılır.
    expected: events.reduce(
      (acc, e) => acc + (e.originalDateIso >= fromIso && e.originalDateIso <= toIso ? e.amount : e.remaining),
      0
    ),
    collected,
    remaining: events.reduce((acc, e) => acc + e.remaining, 0),
    overdue: events.filter((e) => e.dateIso < todayIso).reduce((acc, e) => acc + e.remaining, 0),
  }
}

/** Ödenmemiş her kalem (bu aya kadarki aylar + tüm tek seferlikler), vadeye göre. */
export function outstandingEvents(firms: BillingFirm[], todayIso: string): CalendarEvent[] {
  return firms
    .flatMap((bf) => firmEvents(bf, todayIso, todayIso.slice(0, 7)))
    .filter((e) => e.remaining > 0)
    .sort(byDate)
}

export interface FirmDebt {
  firmId: string
  name: string
  /** Vadesi geçmiş toplam. */
  overdue: number
  /** Vadesi gelmemiş ama ödenmemiş (bu ay + tek seferlik). */
  upcoming: number
  oldestOverdue: string | null
  items: CalendarEvent[]
}

/** Firma bazında borç — en çok gecikmiş borcu olan en üstte. */
export function debtsByFirm(firms: BillingFirm[], todayIso: string): FirmDebt[] {
  const map = new Map<string, FirmDebt>()
  for (const e of outstandingEvents(firms, todayIso)) {
    const d = map.get(e.firmId) ?? {
      firmId: e.firmId,
      name: firms.find((f) => f.firm.id === e.firmId)?.firm.name ?? e.title,
      overdue: 0,
      upcoming: 0,
      oldestOverdue: null,
      items: [],
    }
    if (e.dateIso < todayIso) {
      d.overdue += e.remaining
      if (!d.oldestOverdue || e.dateIso < d.oldestOverdue) d.oldestOverdue = e.dateIso
    } else {
      d.upcoming += e.remaining
    }
    d.items.push(e)
    map.set(e.firmId, d)
  }
  return [...map.values()].sort((a, b) => b.overdue - a.overdue || b.upcoming - a.upcoming)
}

/** Ödeme Al formu için seçenekler: firmanın ödenmemiş kalemleri, en eskisi önce. */
export function paymentOptionsFor(events: CalendarEvent[]): { key: string; label: string; remaining: number }[] {
  return events
    .filter((e) => e.remaining > 0)
    .map((e) => ({
      key: e.kind === "aylik" ? `aylik:${e.period}` : `svc:${e.firmServiceId}`,
      label: e.kind === "aylik" ? e.label : `${e.label} (tek seferlik)`,
      remaining: e.remaining,
    }))
}
