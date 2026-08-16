import type { YakamozJob, YakamozJobStatus } from "@/lib/types"

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
