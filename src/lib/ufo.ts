import type {
  UfoCleaningType,
  UfoHomeType,
  UfoJob,
  UfoJobCategory,
  UfoJobStatus,
  UfoRecordType,
} from "@/lib/types"

export const UFO_CATEGORY_LABELS: Record<UfoJobCategory, string> = {
  ev_temizligi: "Ev Temizliği",
  koltuk_yikama: "Koltuk Yıkama",
}

export const UFO_RECORD_TYPE_LABELS: Record<UfoRecordType, string> = {
  randevu: "Randevu",
  is: "İş",
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
  totalCommission: number
  thisMonthCommission: number
  pendingCount: number
  appointmentCount: number
  totalCount: number
}

export function computeUfoStats(jobs: UfoJob[]): UfoStats {
  const now = new Date()
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const realJobs = jobs.filter((j) => j.record_type === "is")
  const completed = realJobs.filter((j) => j.status === "tamamlandi")
  const completedThisMonth = completed.filter((j) => j.job_date.startsWith(thisMonthPrefix))

  return {
    totalRevenue: completed.reduce((acc, j) => acc + j.amount, 0),
    thisMonthRevenue: completedThisMonth.reduce((acc, j) => acc + j.amount, 0),
    totalCommission: completed.reduce((acc, j) => acc + j.commission_amount, 0),
    thisMonthCommission: completedThisMonth.reduce((acc, j) => acc + j.commission_amount, 0),
    pendingCount: realJobs.filter((j) => j.status === "bekliyor").length,
    appointmentCount: jobs.filter((j) => j.record_type === "randevu").length,
    totalCount: realJobs.length,
  }
}

/** Liste/tablo için kısa etiket: "Ev Temizliği · Dolu Ev" veya "Koltuk Yıkama". */
export function ufoJobTypeLabel(job: Pick<UfoJob, "category" | "cleaning_type">): string {
  if (job.category === "koltuk_yikama") return UFO_CATEGORY_LABELS.koltuk_yikama
  const typeLabel = job.cleaning_type ? UFO_CLEANING_TYPE_LABELS[job.cleaning_type] : null
  return typeLabel ? `${UFO_CATEGORY_LABELS.ev_temizligi} · ${typeLabel}` : UFO_CATEGORY_LABELS.ev_temizligi
}
