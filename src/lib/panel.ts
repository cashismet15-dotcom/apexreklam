import { addDaysIso, formatDayLong, todayIso } from "@/lib/daily-tracker"
import type { AppRole } from "@/lib/session"
import type {
  AiBugSeverity,
  AiBugStatus,
  ClientTaskCategory,
  ClientTaskStatus,
  PanelNote,
  TeamMemberRole,
} from "@/lib/types"

export const TEAM_MEMBERS: { value: TeamMemberRole; label: string }[] = [
  { value: "owner", label: "İsmet" },
  { value: "huseyin", label: "Hüseyin" },
  { value: "batuhan", label: "Batuhan" },
]

export const TEAM_MEMBER_LABEL: Record<TeamMemberRole, string> = {
  owner: "İsmet",
  huseyin: "Hüseyin",
  batuhan: "Batuhan",
}

export const TASK_CATEGORIES: ClientTaskCategory[] = ["video", "reklam", "yapay_zeka", "diger"]

export const TASK_CATEGORY_LABEL: Record<ClientTaskCategory, string> = {
  video: "Video Üretimi",
  reklam: "Reklam Yönetimi",
  yapay_zeka: "Yapay Zeka",
  diger: "Diğer",
}

export const TASK_STATUSES: ClientTaskStatus[] = ["bekliyor", "devam_ediyor", "tamamlandi"]

export const TASK_STATUS_LABEL: Record<ClientTaskStatus, string> = {
  bekliyor: "Bekliyor",
  devam_ediyor: "Devam Ediyor",
  tamamlandi: "Tamamlandı",
}

export const TASK_STATUS_STYLE: Record<ClientTaskStatus, string> = {
  bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  devam_ediyor: "bg-sky-50 text-sky-700 border-sky-200",
  tamamlandi: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

/** Panel'e erişebilen session role'lerini TeamMemberRole'e daraltır; diğer role'ler (ufo/yakamoz/partner) null döner. */
export function toTeamRole(role: AppRole): TeamMemberRole | null {
  if (role === "owner" || role === "huseyin" || role === "batuhan") return role
  return null
}

/** Panel'den müşteri ekleyip şirket/iletişim bilgilerini düzenleyebilecek rolller — Hüseyin dahil değil. */
export function canManageCustomers(role: TeamMemberRole): boolean {
  return role === "owner" || role === "batuhan"
}

/**
 * Panel'den (Batuhan tarafından) eklenen bir müşterinin aylık ücreti/ödeme günü
 * henüz gerçek değerine ayarlanmamışsa kullanılan yer tutucu — ekip tutar
 * göremediği için gerçek bir rakam giremiyor, patron Muhasebe'den tamamlar.
 */
export const PLACEHOLDER_MONTHLY_FEE = 1
export const PLACEHOLDER_PAYMENT_DAY = 1

/** Aylık ücret hâlâ yer tutucudaysa true — "ödeme durumu" anlamsız, önce ücret ayarlanmalı. */
export function needsBillingSetup(customer: { monthly_fee: number }): boolean {
  return customer.monthly_fee <= PLACEHOLDER_MONTHLY_FEE
}

/** Görev vadesi geçti ve hâlâ tamamlanmadıysa true (Günlük Görevler'deki "gecikmiş" kırmızı uyarısıyla aynı mantık). */
export function isTaskOverdue(
  task: { status: ClientTaskStatus; due_date: string | null },
  todayIso: string
): boolean {
  return task.status !== "tamamlandi" && !!task.due_date && task.due_date < todayIso
}

/** Bu ayın 1'i, ISO tarih — Meta reklam raporu period alanı için varsayılan. */
export function currentPeriodIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

/** "Eylül 2026" gibi bir ay etiketi, period (ayın 1'i) ISO tarihinden. */
export function formatPeriodLabel(periodIso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
    new Date(`${periodIso}T00:00:00`)
  )
}

export const BUG_SEVERITIES: AiBugSeverity[] = ["kritik", "orta", "dusuk"]

export const BUG_SEVERITY_LABEL: Record<AiBugSeverity, string> = {
  kritik: "Kritik",
  orta: "Orta",
  dusuk: "Düşük",
}

export const BUG_SEVERITY_STYLE: Record<AiBugSeverity, string> = {
  kritik: "bg-red-50 text-red-700 border-red-200",
  orta: "bg-amber-50 text-amber-700 border-amber-200",
  dusuk: "bg-blue-50 text-blue-700 border-blue-200",
}

export const BUG_STATUSES: AiBugStatus[] = ["acik", "inceleniyor", "cozuldu"]

export const BUG_STATUS_LABEL: Record<AiBugStatus, string> = {
  acik: "Açık",
  inceleniyor: "İnceleniyor",
  cozuldu: "Çözüldü",
}

export const BUG_STATUS_STYLE: Record<AiBugStatus, string> = {
  acik: "bg-red-50 text-red-700 border-red-200",
  inceleniyor: "bg-sky-50 text-sky-700 border-sky-200",
  cozuldu: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

/** Açık hatalar önce (kritik > orta > düşük), çözülenler en sona — liste sıralaması için. */
export function sortBugs<T extends { status: AiBugStatus; severity: AiBugSeverity; created_at: string }>(
  bugs: T[]
): T[] {
  const statusWeight: Record<AiBugStatus, number> = { acik: 0, inceleniyor: 1, cozuldu: 2 }
  const severityWeight: Record<AiBugSeverity, number> = { kritik: 0, orta: 1, dusuk: 2 }

  return [...bugs].sort((a, b) => {
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status]
    }
    if (severityWeight[a.severity] !== severityWeight[b.severity]) {
      return severityWeight[a.severity] - severityWeight[b.severity]
    }
    return b.created_at.localeCompare(a.created_at)
  })
}

export interface NoteDayGroup {
  dateIso: string
  label: string
  notes: PanelNote[]
}

/** "Bugün" / "Dün" / uzun tarih — not günü başlığı için. */
export function formatNoteDayLabel(dateIso: string): string {
  const today = todayIso()
  if (dateIso === today) return "Bugün"
  if (dateIso === addDaysIso(today, -1)) return "Dün"
  return formatDayLong(dateIso)
}

/** timestamptz'nin yerel (Türkiye) tarihi — todayIso()/formatDayLong ile tutarlı kalması için, UTC'ye göre kaymaz. */
function localDateIso(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Notları güne göre gruplar — en yeni gün en üstte, gün içinde en yeni not en üstte. */
export function groupNotesByDay(notes: PanelNote[]): NoteDayGroup[] {
  const groups = new Map<string, PanelNote[]>()

  for (const note of notes) {
    const dateIso = localDateIso(note.created_at)
    const list = groups.get(dateIso) ?? []
    list.push(note)
    groups.set(dateIso, list)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateIso, dayNotes]) => ({
      dateIso,
      label: formatNoteDayLabel(dateIso),
      notes: dayNotes,
    }))
}

// Türkiye sabit UTC+3 kullanır (yaz saati uygulaması yok) — sunucu hangi saat
// diliminde çalışırsa çalışsın (Vercel varsayılan UTC) saatlerin doğru
// görünmesi için tüm saat gösterimlerinde bunu açıkça belirtiyoruz.
const TR_TIME_ZONE = "Europe/Istanbul"

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TR_TIME_ZONE,
})

/** "14:32" gibi, Türkiye saatine göre — timestamptz'den. */
export function formatTimeTr(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

const meetingDateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TR_TIME_ZONE,
})

/** "10 Eylül 14:30" gibi — toplantı tarihi/saati için. */
export function formatMeetingDateTime(iso: string): string {
  return meetingDateTimeFormatter.format(new Date(iso))
}

/**
 * Bir <input type="datetime-local"> değerini ("2026-09-10T14:30", saat dilimsiz,
 * kullanıcının yerel saatiyle) Türkiye saati (+03:00) kabul edip doğru bir ISO
 * timestamp'e çevirir — sunucunun kendi saat dilimine bağlı kalmadan.
 */
export function localDateTimeToIso(value: string): string | null {
  const match = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.exec(value)
  if (!match) return null
  const d = new Date(`${match[0]}:00+03:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/** Bir toplantı hâlâ gelecekteyse (henüz geçmediyse) true. */
export function isMeetingUpcoming(meeting: { meeting_at: string }, nowIso: string): boolean {
  return meeting.meeting_at >= nowIso
}
