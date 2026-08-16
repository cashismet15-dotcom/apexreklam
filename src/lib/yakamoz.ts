import type { YakamozCustomerSummary, YakamozJob, YakamozJobStatus } from "@/lib/types"

export const YAKAMOZ_STATUS_LABELS: Record<YakamozJobStatus, string> = {
  siparis_alindi: "Sipariş Alındı",
  yikamada: "Yıkamada",
  bitti: "Bitti",
  yolda: "Yolda",
}

export const YAKAMOZ_STATUS_ORDER: YakamozJobStatus[] = [
  "siparis_alindi",
  "yikamada",
  "bitti",
  "yolda",
]

/** İlçe → mahalle → kayıtlar. İlçeler alfabetik, mahalleler içinde en yeni kayıt en üstte. */
export function groupYakamozJobsByIlce(jobs: YakamozJob[]): Map<string, Map<string, YakamozJob[]>> {
  const byIlce = new Map<string, Map<string, YakamozJob[]>>()

  for (const job of jobs) {
    const mahalle = job.mahalle?.trim() || "Mahalle belirtilmedi"
    let byMahalle = byIlce.get(job.ilce)
    if (!byMahalle) {
      byMahalle = new Map<string, YakamozJob[]>()
      byIlce.set(job.ilce, byMahalle)
    }
    const list = byMahalle.get(mahalle) ?? []
    list.push(job)
    byMahalle.set(mahalle, list)
  }

  return new Map([...byIlce.entries()].sort(([a], [b]) => a.localeCompare(b, "tr")))
}

/** Son 10 haneye göre karşılaştırır — ülke kodu/başındaki 0 farkını tolere eder. */
export function phoneLast10(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10)
}

/** Son hizmetin üzerinden bu kadar gün geçtiyse hatırlatma zamanı gelmiş sayılır. */
export const YAKAMOZ_REMINDER_THRESHOLD_DAYS = 60

/** Telefona göre gruplayıp her müşteri için son tamamlanan hizmeti ve hatırlatma durumunu hesaplar. */
export function getYakamozCustomerSummaries(jobs: YakamozJob[]): YakamozCustomerSummary[] {
  const byPhone = new Map<string, YakamozJob[]>()
  for (const job of jobs) {
    const list = byPhone.get(job.phone) ?? []
    list.push(job)
    byPhone.set(job.phone, list)
  }

  const now = Date.now()
  const summaries: YakamozCustomerSummary[] = []

  for (const [phone, phoneJobs] of byPhone) {
    const completedDates = phoneJobs
      .filter((j) => j.status === "bitti" && j.requested_date)
      .map((j) => j.requested_date as string)
      .sort()

    const lastServiceDate = completedDates.at(-1) ?? null
    const daysSince = lastServiceDate
      ? Math.floor((now - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    summaries.push({
      phone,
      customer_name: phoneJobs.find((j) => j.customer_name)?.customer_name ?? null,
      lastServiceDate,
      totalJobs: phoneJobs.length,
      needsReminder: daysSince != null && daysSince >= YAKAMOZ_REMINDER_THRESHOLD_DAYS,
    })
  }

  return summaries.sort((a, b) => {
    if (a.needsReminder !== b.needsReminder) return a.needsReminder ? -1 : 1
    return (b.lastServiceDate ?? "").localeCompare(a.lastServiceDate ?? "")
  })
}
