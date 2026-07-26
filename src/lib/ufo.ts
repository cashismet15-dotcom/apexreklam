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
  const completedThisMonth = completed.filter((j) => j.job_date?.startsWith(thisMonthPrefix) ?? false)

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

/** job_date'e göre gruplar (tarihsiz/esnek kayıtlar hariç); her gün içinde saate göre sıralı. */
export function groupUfoJobsByDate(jobs: UfoJob[]): Map<string, UfoJob[]> {
  const byDate = new Map<string, UfoJob[]>()
  for (const job of jobs) {
    if (!job.job_date) continue
    const list = byDate.get(job.job_date) ?? []
    list.push(job)
    byDate.set(job.job_date, list)
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => (a.job_time ?? "99:99").localeCompare(b.job_time ?? "99:99"))
  }
  return byDate
}

/** Tarihi belirtilmemiş (esnek tarihli) kayıtlar. */
export function getFlexibleDateJobs(jobs: UfoJob[]): UfoJob[] {
  return jobs.filter((j) => !j.job_date)
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/** Pazartesi başlangıçlı, 6 haftalık (42 gün) ay görünümü için ISO tarih listesi. */
export function buildMonthGrid(year: number, month: number): string[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month - 1, 1 - firstWeekday)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  })
}
