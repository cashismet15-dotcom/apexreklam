import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TaskStatusControl } from "@/components/panel/task-status-control"
import { TASK_CATEGORY_LABEL } from "@/lib/panel"
import type { ClientTaskWithCustomer } from "@/lib/types"
import { cn } from "@/lib/utils"

/** `dueIso` bugünden kaç gün uzakta — negatifse gecikmiş demektir. */
function daysFromToday(dueIso: string, todayIso: string): number {
  const due = new Date(`${dueIso}T00:00:00`)
  const today = new Date(`${todayIso}T00:00:00`)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function DueBadge({ dueDate, todayIso }: { dueDate: string | null; todayIso: string }) {
  if (!dueDate) return null

  const diff = daysFromToday(dueDate, todayIso)

  if (diff < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
        <AlertTriangle className="size-3" />
        {Math.abs(diff)} gün gecikti
      </span>
    )
  }
  if (diff === 0) {
    return <span className="text-xs font-medium text-amber-600">Bugün son gün</span>
  }
  return <span className="text-xs text-muted-foreground">Kalan süre: {diff} gün</span>
}

function TaskRow({ task, todayIso }: { task: ClientTaskWithCustomer; todayIso: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {task.customer ? (
            <Link
              href={`/panel/${task.customer_id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              {task.customer.company_name}
            </Link>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Genel</span>
          )}
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {TASK_CATEGORY_LABEL[task.category]}
          </Badge>
        </div>
        <span className="text-sm font-medium">{task.title}</span>
        <DueBadge dueDate={task.due_date} todayIso={todayIso} />
      </div>
      <TaskStatusControl taskId={task.id} status={task.status} />
    </div>
  )
}

/**
 * Görevlerimi tek bir listede toplar — tamamlanmamış her şey burada kalır.
 * Süresi geçmiş görevler kırmızı "gecikti" uyarısıyla, gelecekteki görevler
 * "kalan süre" ile gösterilir; hiçbir görev günlere bölünüp gözden kaybolmaz.
 * En acil olan (en çok gecikmiş / en yakın son tarihli) en üstte.
 */
export function TodayTasks({
  tasks,
  todayIso,
}: {
  tasks: ClientTaskWithCustomer[]
  todayIso: string
}) {
  return (
    <Card className={cn("gap-0 py-0")}>
      <CardContent className="flex max-h-[32rem] flex-col divide-y overflow-y-auto p-0">
        {tasks.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">Açık görev yok.</p>
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} todayIso={todayIso} />)
        )}
      </CardContent>
    </Card>
  )
}
