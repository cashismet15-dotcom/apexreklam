export const AY_ADLARI = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

export const AY_KISA = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
]

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const dateShortFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatDateShort(iso: string): string {
  return dateShortFormatter.format(new Date(iso))
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

/** Bugüne göre gün farkı (pozitif: gelecekte, negatif: geçmişte). */
export function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const diffMs = target.getTime() - today.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function kalanGunEtiketi(iso: string): string {
  const gun = daysUntil(iso)
  if (gun < 0) return `${Math.abs(gun)} gün gecikti`
  if (gun === 0) return "Bugün"
  if (gun === 1) return "Yarın"
  return `${gun} gün kaldı`
}
