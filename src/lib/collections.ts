import { AY_KISA, daysUntil, formatDateShort } from "@/lib/format"
import type { Customer, Payment, PaymentWithCustomer } from "@/lib/types"

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Verilen yıl/ay için ödeme günü, ayın gün sayısına göre sıkıştırılmış ISO tarih. */
function dueDateForCycle(year: number, month: number, paymentDay: number): string {
  const day = Math.min(paymentDay, daysInMonth(year, month))
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function nextCycle(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}

/** ISO tarihe gün ekler (negatif olabilir), takvim ay/yıl taşmalarını doğru şekilde çözer. */
function addDaysIso(iso: string, days: number): string {
  if (!days) return iso
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function prevCycle(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

export interface CustomerCollectionStatus {
  customer: Customer
  isPaidThisMonth: boolean
  isPartiallyPaid: boolean
  paidThisMonth: number
  remainingThisMonth: number
  dueDate: string
  projectedAmount: number
  daysUntilDue: number
  isOverdue: boolean
  /** Bu durumun hesaplandığı asıl döngü (bugünkü ay olmayabilir, bkz. findActiveCycle). */
  cycleYear: number
  cycleMonth: number
}

/** Kuruş farklarından kaynaklanan yanlış pozitifleri önlemek için. */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const ACTIVE_CYCLE_LOOKBACK_MONTHS = 3

/**
 * Bir müşteri için "aktif" ay/yıl döngüsünü bulur — normalde içinde bulunduğumuz
 * takvim ayı, AMA eğer geçmiş 1-3 ay içinde kapora gibi kısmi bir ödeme alınıp
 * kalanı hâlâ tamamlanmadıysa, o eski döngü "aktif" kabul edilir. Böylece ay
 * değiştiğinde kapora bakiyesi sistemden kaybolmaz; kalan tahsil edilene kadar
 * takip edilmeye devam eder. Hiç ödeme satırı olmayan (sadece unutulmuş) eski
 * aylar kasıtlı olarak taşınmaz — aksi halde dijital kayıt öncesi/eksik geçmiş
 * aylar sahte borç gibi görünür.
 */
export function findActiveCycle(
  customer: Pick<Customer, "monthly_fee">,
  customerPayments: { year: number; month: number; amount: number }[]
): { year: number; month: number } {
  const now = new Date()
  const currentCycle = { year: now.getFullYear(), month: now.getMonth() + 1 }

  let cursor = currentCycle
  const olderCycles: { year: number; month: number }[] = []
  for (let i = 0; i < ACTIVE_CYCLE_LOOKBACK_MONTHS; i++) {
    cursor = prevCycle(cursor.year, cursor.month)
    olderCycles.unshift(cursor)
  }

  for (const { year, month } of olderCycles) {
    const cyclePayments = customerPayments.filter((p) => p.year === year && p.month === month)
    if (cyclePayments.length === 0) continue
    const paid = round2(cyclePayments.reduce((acc, p) => acc + p.amount, 0))
    if (paid < customer.monthly_fee) {
      return { year, month }
    }
  }

  return currentCycle
}

/**
 * Sadece aktif müşteriler için, aktif tahsilat döngüsündeki durumu hesaplar.
 * Döngü normalde bugünkü aydır, ama açık kalmış bir kapora bakiyesi varsa
 * findActiveCycle o eski ayı döndürür (bkz. yukarıdaki açıklama).
 *
 * O döngü için alınan ödemeler (kapora + kalan gibi birden fazla satır olabilir)
 * toplanır ve aylık ücretle karşılaştırılır:
 * 1. Toplam >= aylık ücret -> Ödendi.
 * 2. 0 < toplam < aylık ücret -> Kısmi Ödendi. Vade tarihi olarak, kapora
 *    alınırken girilmiş expected_remaining_date (en son girilen) kullanılır;
 *    girilmemişse normal payment_day'e düşülür.
 * 3. Toplam 0 -> normal payment_day'e göre Bekliyor / Gecikti.
 */
export function computeCollectionStatuses(
  customers: Customer[],
  payments: Payment[] | PaymentWithCustomer[]
): CustomerCollectionStatus[] {
  const paymentsByCustomerId = new Map<string, Payment[] | PaymentWithCustomer[]>()
  for (const p of payments) {
    const list = paymentsByCustomerId.get(p.customer_id) ?? []
    list.push(p)
    paymentsByCustomerId.set(p.customer_id, list)
  }

  return customers
    .filter((c) => c.status === "aktif")
    .map((customer) => {
      const customerPayments = paymentsByCustomerId.get(customer.id) ?? []
      const { year, month } = findActiveCycle(customer, customerPayments)
      const cyclePayments = customerPayments.filter((p) => p.year === year && p.month === month)

      const paidThisMonth = round2(cyclePayments.reduce((acc, p) => acc + p.amount, 0))
      const remainingThisMonth = Math.max(0, round2(customer.monthly_fee - paidThisMonth))
      const isPaidThisMonth = remainingThisMonth <= 0
      const isPartiallyPaid = paidThisMonth > 0 && !isPaidThisMonth

      let expectedRemainingDate: string | undefined
      for (const p of cyclePayments) {
        if (p.expected_remaining_date && (!expectedRemainingDate || p.expected_remaining_date > expectedRemainingDate)) {
          expectedRemainingDate = p.expected_remaining_date
        }
      }
      const dueDateThisMonth = expectedRemainingDate ?? dueDateForCycle(year, month, customer.payment_day)

      let dueDate: string
      if (isPaidThisMonth) {
        const next = nextCycle(year, month)
        dueDate = dueDateForCycle(next.year, next.month, customer.payment_day)
      } else {
        dueDate = dueDateThisMonth
      }
      // Geçmişte dondurulmuş günler varsa vade o kadar ileri kayar — donduruldu
      // günler kaybolmaz, sadece ödeme tarihi ötelenir.
      dueDate = addDaysIso(dueDate, customer.freeze_offset_days)

      const daysUntilDue = daysUntil(dueDate)
      const isOverdue = !isPaidThisMonth && daysUntilDue < 0

      return {
        customer,
        isPaidThisMonth,
        isPartiallyPaid,
        paidThisMonth,
        remainingThisMonth,
        dueDate,
        projectedAmount: customer.monthly_fee,
        daysUntilDue,
        isOverdue,
        cycleYear: year,
        cycleMonth: month,
      }
    })
}

export interface DashboardStats {
  expectedThisMonth: number
  collectedThisMonth: number
  remainingThisMonth: number
  next7Days: number
  next30Days: number
  overdueAmount: number
  overdueCount: number
  activeCustomerCount: number
}

/** dueDate, verilen yıl/aydan SONRAKİ bir takvim ayına mı düşüyor (örn. kapora kalanı gelecek ay bekleniyorsa). */
function isDueInFutureMonth(dueDate: string, year: number, month: number): boolean {
  const d = new Date(dueDate)
  const dueYear = d.getFullYear()
  const dueMonth = d.getMonth() + 1
  return dueYear > year || (dueYear === year && dueMonth > month)
}

/**
 * Bir durumun vadesinde beklenen tutar. Zaten ödendiyse vade bir sonraki ayın
 * tam ücretidir; kısmi/hiç ödenmediyse sadece kalan tutar beklenir (aksi halde
 * kapora ikinci kez sayılır, ya da ödenmiş bir ay 0 TL olarak görünür).
 */
export function amountDue(s: CustomerCollectionStatus): number {
  return s.isPaidThisMonth ? s.projectedAmount : s.remainingThisMonth
}

export function computeDashboardStats(
  statuses: CustomerCollectionStatus[],
  payments: PaymentWithCustomer[]
): DashboardStats {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const expectedThisMonth = statuses.reduce((acc, s) => acc + s.customer.monthly_fee, 0)

  const collectedThisMonth = payments
    .filter((p) => p.year === year && p.month === month)
    .reduce((acc, p) => acc + p.amount, 0)

  // Bu ay içinde (veya geçmişten kalma, hâlâ gecikmiş) beklenen her şeyin toplamı.
  // Vadesi gelecek bir aya düşen kapora kalanları hariç — onlar bu ayın parası değil,
  // o ayın parası olmayı bekliyor (Takvim'de "Gelecek Ay" altında ayrıca görünür).
  const remainingThisMonth = statuses
    .filter((s) => !isDueInFutureMonth(s.dueDate, year, month))
    .reduce((acc, s) => acc + s.remainingThisMonth, 0)

  const upcoming = statuses.filter((s) => !s.isOverdue)

  const next7Days = upcoming
    .filter((s) => s.daysUntilDue >= 0 && s.daysUntilDue <= 7)
    .reduce((acc, s) => acc + amountDue(s), 0)

  const next30Days = upcoming
    .filter((s) => s.daysUntilDue >= 0 && s.daysUntilDue <= 30)
    .reduce((acc, s) => acc + amountDue(s), 0)

  const overdue = statuses.filter((s) => s.isOverdue)
  const overdueAmount = overdue.reduce((acc, s) => acc + s.remainingThisMonth, 0)
  const overdueCount = overdue.length

  return {
    expectedThisMonth,
    collectedThisMonth,
    remainingThisMonth,
    next7Days,
    next30Days,
    overdueAmount,
    overdueCount,
    activeCustomerCount: statuses.length,
  }
}

export function yaklasanTahsilatlar(
  statuses: CustomerCollectionStatus[],
  limit = 6
): CustomerCollectionStatus[] {
  return [...statuses]
    .filter((s) => !s.isOverdue)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, limit)
}

export function bugunOdemeYapacaklar(
  statuses: CustomerCollectionStatus[]
): CustomerCollectionStatus[] {
  return statuses.filter((s) => !s.isPaidThisMonth && s.daysUntilDue === 0)
}

export function buAyOdemeYapmayanlar(
  statuses: CustomerCollectionStatus[]
): CustomerCollectionStatus[] {
  return [...statuses]
    .filter((s) => !s.isPaidThisMonth)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}

export function sonOdemeler(
  payments: PaymentWithCustomer[],
  limit = 5
): PaymentWithCustomer[] {
  return payments.slice(0, limit)
}

/** Bugünden geriye doğru, en eskisi başta olacak şekilde ay/yıl döngüleri. */
function monthsBackList(monthsBack: number): { year: number; month: number }[] {
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() + 1

  const list: { year: number; month: number }[] = []
  for (let i = 0; i < monthsBack; i++) {
    list.unshift({ year, month })
    month -= 1
    if (month === 0) {
      month = 12
      year -= 1
    }
  }
  return list
}

export type MonthlyHistoryStatus =
  | "odendi"
  | "kismi"
  | "bekliyor"
  | "gecikti"
  | "odenmedi"
  | "yok"

export interface MonthlyHistoryEntry {
  year: number
  month: number
  label: string
  total: number
  status: MonthlyHistoryStatus
}

/**
 * Bir müşterinin son N ayı için ay ay tahsilat özeti.
 * Müşterinin start_date'inden önceki aylar "yok" (henüz müşteri değildi) olarak işaretlenir.
 * İçinde bulunduğumuz ay hiç ödeme almadıysa, vade günü geçtiyse "gecikti" (info
 * kartındaki canlı "Bu Ay" rozetiyle aynı sonucu verir), geçmediyse "bekliyor".
 * Geçmiş bir ay hiç ödeme almadıysa "odenmedi".
 */
export function computeMonthlyHistory(
  customer: Customer,
  customerPayments: Payment[],
  monthsBack = 6
): MonthlyHistoryEntry[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  const start = new Date(customer.start_date)
  const startYear = start.getFullYear()
  const startMonth = start.getMonth() + 1

  return monthsBackList(monthsBack).map(({ year, month }) => {
    const total = round2(
      customerPayments
        .filter((p) => p.year === year && p.month === month)
        .reduce((acc, p) => acc + p.amount, 0)
    )

    const isBeforeStart = year < startYear || (year === startYear && month < startMonth)
    const isCurrentMonth = year === currentYear && month === currentMonth
    const isPastMonth =
      year < currentYear || (year === currentYear && month < currentMonth)

    let status: MonthlyHistoryStatus
    if (isBeforeStart) {
      status = "yok"
    } else if (total >= customer.monthly_fee) {
      status = "odendi"
    } else if (total > 0) {
      status = "kismi"
    } else if (isPastMonth) {
      status = "odenmedi"
    } else if (isCurrentMonth && currentDay > customer.payment_day) {
      status = "gecikti"
    } else {
      status = "bekliyor"
    }

    return { year, month, label: `${AY_KISA[month - 1]} ${year}`, total, status }
  })
}

export interface MonthlyRevenueEntry {
  year: number
  month: number
  label: string
  total: number
}

/** Tüm müşteriler için son N ayın toplam tahsilat trendi (dashboard grafiği). */
export function computeMonthlyRevenueTrend(
  payments: Payment[] | PaymentWithCustomer[],
  monthsBack = 6
): MonthlyRevenueEntry[] {
  return monthsBackList(monthsBack).map(({ year, month }) => {
    const total = round2(
      payments
        .filter((p) => p.year === year && p.month === month)
        .reduce((acc, p) => acc + p.amount, 0)
    )
    return { year, month, label: AY_KISA[month - 1], total }
  })
}

/** Verilen tarihin ait olduğu haftanın Pazartesi'si, saat sıfırlanmış. */
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  return date
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export interface GrowthStats {
  newCustomersThisWeek: number
  newMrrThisWeek: number
  newCustomersThisMonth: number
  newMrrThisMonth: number
  totalMrr: number
}

/**
 * Bu hafta / bu ay eklenen müşteri sayısı ve bunların getirdiği aylık gelir (MRR)
 * artışı — "sistem ne kadar büyüyor" sorusunun cevabı. Sadece aktif müşteriler
 * sayılır; pasife alınan bir müşterinin ne zaman ayrıldığı veriden bilinmediği
 * için büyüme yalnızca katılım tarihine (start_date) göre hesaplanır.
 */
export function computeGrowthStats(customers: Customer[]): GrowthStats {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const active = customers.filter((c) => c.status === "aktif")
  const thisWeek = active.filter((c) => new Date(c.start_date) >= weekStart)
  const thisMonth = active.filter((c) => new Date(c.start_date) >= monthStart)

  return {
    newCustomersThisWeek: thisWeek.length,
    newMrrThisWeek: round2(thisWeek.reduce((acc, c) => acc + c.monthly_fee, 0)),
    newCustomersThisMonth: thisMonth.length,
    newMrrThisMonth: round2(thisMonth.reduce((acc, c) => acc + c.monthly_fee, 0)),
    totalMrr: round2(active.reduce((acc, c) => acc + c.monthly_fee, 0)),
  }
}

export interface MrrGrowthPoint {
  weekStart: string
  label: string
  cumulativeMrr: number
  cumulativeCustomers: number
  newCustomers: number
}

/**
 * Son N hafta için, o haftanın sonunda aktif müşteri tabanının toplam aylık
 * geliri (MRR) ve müşteri sayısı — kümülatif büyüme eğrisi (dashboard grafiği).
 */
export function computeMrrGrowthTrend(customers: Customer[], weeksBack = 10): MrrGrowthPoint[] {
  const active = customers.filter((c) => c.status === "aktif")
  const currentWeekStart = startOfWeek(new Date())

  const weekStarts: Date[] = []
  for (let i = weeksBack - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() - i * 7)
    weekStarts.push(d)
  }

  return weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const joinedByWeekEnd = active.filter((c) => new Date(c.start_date) < weekEnd)
    const newThisWeek = active.filter((c) => {
      const started = new Date(c.start_date)
      return started >= weekStart && started < weekEnd
    })

    return {
      weekStart: weekStart.toISOString().slice(0, 10),
      label: formatDateShort(weekStart.toISOString()),
      cumulativeMrr: round2(joinedByWeekEnd.reduce((acc, c) => acc + c.monthly_fee, 0)),
      cumulativeCustomers: joinedByWeekEnd.length,
      newCustomers: newThisWeek.length,
    }
  })
}
