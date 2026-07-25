import type { UfoCleaningType, UfoHomeType, UfoJob, UfoJobCategory, UfoJobStatus } from "@/lib/types"

export const UFO_CATEGORY_LABELS: Record<UfoJobCategory, string> = {
  ev_temizligi: "Ev Temizliği",
  koltuk_yikama: "Koltuk Yıkama",
}

export const UFO_CLEANING_TYPE_LABELS: Record<UfoCleaningType, string> = {
  dolu_ev: "Dolu Ev",
  kiraci_sonrasi: "Kiracı Sonrası",
  insaat_sonrasi: "İnşaat Sonrası",
}

export const UFO_STATUS_LABELS: Record<UfoJobStatus, string> = {
  bekliyor: "Bekliyor",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
}

export const UFO_HOME_TYPES: UfoHomeType[] = ["1+1", "2+1", "3+1", "4+1", "5+1"]

export interface UfoStats {
  totalRevenue: number
  thisMonthRevenue: number
  pendingCount: number
  totalCount: number
}

export function computeUfoStats(jobs: UfoJob[]): UfoStats {
  const now = new Date()
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const completed = jobs.filter((j) => j.status === "tamamlandi")

  return {
    totalRevenue: completed.reduce((acc, j) => acc + j.amount, 0),
    thisMonthRevenue: completed
      .filter((j) => j.job_date.startsWith(thisMonthPrefix))
      .reduce((acc, j) => acc + j.amount, 0),
    pendingCount: jobs.filter((j) => j.status === "bekliyor").length,
    totalCount: jobs.length,
  }
}

/** Liste/tablo için kısa etiket: "Ev Temizliği · Dolu Ev" veya "Koltuk Yıkama". */
export function ufoJobTypeLabel(job: Pick<UfoJob, "category" | "cleaning_type">): string {
  if (job.category === "koltuk_yikama") return UFO_CATEGORY_LABELS.koltuk_yikama
  const typeLabel = job.cleaning_type ? UFO_CLEANING_TYPE_LABELS[job.cleaning_type] : null
  return typeLabel ? `${UFO_CATEGORY_LABELS.ev_temizligi} · ${typeLabel}` : UFO_CATEGORY_LABELS.ev_temizligi
}
