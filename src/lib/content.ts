import type { ContentStatus, ContentWeek, Customer } from "@/lib/types"

export const CONTENT_STATUSES: ContentStatus[] = [
  "talimat_bekliyor",
  "hazirlaniyor",
  "onayda",
  "yayinlandi",
]

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  talimat_bekliyor: "Talimat Bekliyor",
  hazirlaniyor: "Hazırlanıyor",
  onayda: "Onayda",
  yayinlandi: "Yayınlandı",
}

export const CONTENT_STATUS_STYLE: Record<ContentStatus, string> = {
  talimat_bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  hazirlaniyor: "bg-sky-50 text-sky-700 border-sky-200",
  onayda: "bg-violet-50 text-violet-700 border-violet-200",
  yayinlandi: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

/** İçinde bulunduğumuz haftanın Pazartesi'si, ISO tarih olarak. */
export function currentWeekStartIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export interface ClientContentOverview {
  customer: Customer
  currentWeek: ContentWeek | null
}

/** Aktif müşterileri, o haftaki (varsa) content_weeks kaydıyla eşler. */
export function buildContentOverview(
  customers: Customer[],
  currentWeekEntries: ContentWeek[]
): ClientContentOverview[] {
  const byCustomerId = new Map(currentWeekEntries.map((w) => [w.customer_id, w]))
  return customers
    .filter((c) => c.status === "aktif")
    .map((customer) => ({
      customer,
      currentWeek: byCustomerId.get(customer.id) ?? null,
    }))
}

export interface ContentStatusCounts {
  talimat_bekliyor: number
  hazirlaniyor: number
  onayda: number
  yayinlandi: number
  yok: number
}

/** Dashboard üstü özet: bu hafta hangi durumdan kaç müşteri var. */
export function computeContentStatusCounts(
  overview: ClientContentOverview[]
): ContentStatusCounts {
  const counts: ContentStatusCounts = {
    talimat_bekliyor: 0,
    hazirlaniyor: 0,
    onayda: 0,
    yayinlandi: 0,
    yok: 0,
  }
  for (const item of overview) {
    if (!item.currentWeek) {
      counts.yok += 1
    } else {
      counts[item.currentWeek.status] += 1
    }
  }
  return counts
}
