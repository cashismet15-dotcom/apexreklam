import "server-only"

import { todayIso } from "@/lib/daily-tracker"
import { supabase } from "@/lib/supabase"
import type { DailyTask, DailyTaskLog, DailyTaskPerson } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

/** Bir görevin belirli bir gündeki hücresi: işaretlendi mi, geçmişte kaldıysa ve işaretlenmediyse gecikmiş sayılır. */
export interface DailyTaskCell {
  date: string
  done: boolean
  overdue: boolean
}

export interface DailyTaskBoardRow {
  task: DailyTask
  cells: DailyTaskCell[]
}

export interface DailyTaskBoardPerson {
  person: DailyTaskPerson
  rows: DailyTaskBoardRow[]
  overdueCount: number
}

export interface DailyTaskBoard {
  dates: string[]
  people: DailyTaskBoardPerson[]
  totalTasks: number
  totalOverdue: number
}

/** Verilen tarih aralığı için tüm kişileri, görevlerini ve her günkü işaretlenme/gecikme durumunu getirir. */
export async function getDailyTaskBoard(dates: string[]): Promise<DailyTaskBoard> {
  const today = todayIso()

  const { data: people, error: peopleError } = await supabase
    .from("daily_task_people")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })

  if (peopleError) fail("Kişiler alınamadı", peopleError)

  const personIds = (people ?? []).map((p) => p.id)

  const [tasksResult, logsResult] =
    personIds.length === 0
      ? [
          { data: [] as DailyTask[], error: null },
          { data: [] as DailyTaskLog[], error: null },
        ]
      : await Promise.all([
          supabase
            .from("daily_tasks")
            .select("*")
            .in("person_id", personIds)
            .eq("active", true)
            .order("sort_order", { ascending: true }),
          supabase.from("daily_task_logs").select("*").in("log_date", dates),
        ])

  if (tasksResult.error) fail("Görevler alınamadı", tasksResult.error)
  if (logsResult.error) fail("Günlük kayıtlar alınamadı", logsResult.error)

  // task_id -> log_date -> done
  const doneMap = new Map<string, Map<string, boolean>>()
  for (const log of logsResult.data ?? []) {
    if (!doneMap.has(log.task_id)) doneMap.set(log.task_id, new Map())
    doneMap.get(log.task_id)!.set(log.log_date, log.done)
  }

  const tasksByPerson = new Map<string, DailyTask[]>()
  for (const task of tasksResult.data ?? []) {
    const list = tasksByPerson.get(task.person_id) ?? []
    list.push(task)
    tasksByPerson.set(task.person_id, list)
  }

  const boardPeople: DailyTaskBoardPerson[] = (people ?? []).map((person) => {
    const rows: DailyTaskBoardRow[] = (tasksByPerson.get(person.id) ?? []).map((task) => {
      const taskDoneMap = doneMap.get(task.id)
      const cells: DailyTaskCell[] = dates.map((date) => {
        const done = taskDoneMap?.get(date) ?? false
        return { date, done, overdue: !done && date < today }
      })
      return { task, cells }
    })

    const overdueCount = rows.reduce(
      (acc, row) => acc + row.cells.filter((c) => c.overdue).length,
      0
    )

    return { person, rows, overdueCount }
  })

  return {
    dates,
    people: boardPeople,
    totalTasks: boardPeople.reduce((acc, p) => acc + p.rows.length, 0),
    totalOverdue: boardPeople.reduce((acc, p) => acc + p.overdueCount, 0),
  }
}
