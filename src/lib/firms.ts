import type { FirmStage, ServiceBilling } from "@/lib/types"

/** Funnel sırası — İlk Görüşme → Teklif Verildi → Olumlu / Olumsuz. */
export const FIRM_STAGES: FirmStage[] = ["ilk_gorusme", "teklif_verildi", "olumlu", "olumsuz"]

/** Henüz sonuçlanmamış (takipteki) aşamalar. */
export const OPEN_FIRM_STAGES: FirmStage[] = ["ilk_gorusme", "teklif_verildi"]

export const FIRM_STAGE_LABEL: Record<FirmStage, string> = {
  ilk_gorusme: "İlk Görüşme",
  teklif_verildi: "Teklif Verildi",
  olumlu: "Olumlu",
  olumsuz: "Olumsuz",
}

export const FIRM_STAGE_STYLE: Record<FirmStage, string> = {
  ilk_gorusme: "bg-sky-50 text-sky-700 border-sky-200",
  teklif_verildi: "bg-amber-50 text-amber-700 border-amber-200",
  olumlu: "bg-emerald-50 text-emerald-700 border-emerald-200",
  olumsuz: "bg-red-50 text-red-700 border-red-200",
}

export const SERVICE_BILLING_LABEL: Record<ServiceBilling, string> = {
  aylik: "Aylık",
  tek_seferlik: "Tek Seferlik",
}

/** Anlaşmadan sonra işe başlama ve ilk ödeme için varsayılan bekleme (gün). */
export const DEFAULT_START_DELAY_DAYS = 7

/** "instagram.com/x", "@x" veya tam URL — tıklanabilir bir https linkine çevirir. */
export function toExternalUrl(value: string, base?: string): string {
  const v = value.trim()
  if (/^https?:\/\//i.test(v)) return v
  if (base && v.startsWith("@")) return `${base}${v.slice(1)}`
  if (base && !v.includes(".")) return `${base}${v}`
  return `https://${v}`
}

/** WhatsApp için telefonu 90XXXXXXXXXX biçimine getirir. */
export function toWhatsappNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) digits = digits.slice(1)
  if (!digits.startsWith("90")) digits = `90${digits}`
  return digits
}
