import type { DailyHabit, DailyHabitLog } from "@/lib/types"

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Bugünün tarihi, yerel saatle ISO (YYYY-MM-DD) olarak. */
export function todayIso(): string {
  return toIso(new Date())
}

/** Verilen ISO tarihe `days` gün ekler (negatif olabilir). */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

/** Verilen ISO tarihin içinde bulunduğu haftanın Pazartesi'si. */
export function weekStartIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  return toIso(d)
}

/** Bir hafta başlangıcından (Pazartesi) o haftanın 7 gününü döner. */
export function buildWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i))
}

/** "Pzt 21 Tem" gibi kısa gün etiketi. */
export function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const weekday = WEEKDAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const dayMonth = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(d)
  return `${weekday} ${dayMonth}`
}

/** "21 Temmuz 2026" gibi uzun tarih etiketi. */
export function formatDayLong(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`))
}

/** "21 Tem – 27 Tem 2026" gibi hafta aralığı etiketi. */
export function formatWeekRangeLabel(weekStart: string): string {
  const dates = buildWeekDates(weekStart)
  const start = new Date(`${dates[0]}T00:00:00`)
  const end = new Date(`${dates[6]}T00:00:00`)
  const startLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
    start
  )
  const endLabel = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end)
  return `${startLabel} – ${endLabel}`
}

export interface WeeklyReport {
  weekStart: string
  dates: string[]
  habits: DailyHabit[]
  /** habitId -> date -> done */
  doneMap: Map<string, Map<string, boolean>>
  /** Her gün için tamamlanan/toplam görev sayısı ve yüzde. */
  dayStats: { date: string; done: number; total: number; pct: number }[]
  totalDone: number
  totalPossible: number
  completionPct: number
}

export function buildWeeklyReport(
  weekStart: string,
  habits: DailyHabit[],
  logs: DailyHabitLog[]
): WeeklyReport {
  const dates = buildWeekDates(weekStart)
  const doneMap = new Map<string, Map<string, boolean>>()
  for (const habit of habits) doneMap.set(habit.id, new Map())
  for (const log of logs) {
    if (!doneMap.has(log.habit_id)) doneMap.set(log.habit_id, new Map())
    doneMap.get(log.habit_id)!.set(log.log_date, log.done)
  }

  const dayStats = dates.map((date) => {
    const total = habits.length
    const done = habits.reduce((acc, h) => acc + (doneMap.get(h.id)?.get(date) ? 1 : 0), 0)
    return { date, done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
  })

  const totalDone = dayStats.reduce((acc, d) => acc + d.done, 0)
  const totalPossible = dayStats.reduce((acc, d) => acc + d.total, 0)

  return {
    weekStart,
    dates,
    habits,
    doneMap,
    dayStats,
    totalDone,
    totalPossible,
    completionPct: totalPossible === 0 ? 0 : Math.round((totalDone / totalPossible) * 100),
  }
}
