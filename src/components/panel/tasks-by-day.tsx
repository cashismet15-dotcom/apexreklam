import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskStatusControl } from "@/components/panel/task-status-control"
import { TASK_CATEGORY_LABEL } from "@/lib/panel"
import type { ClientTaskWithCustomer } from "@/lib/types"
import { cn } from "@/lib/utils"

function TaskMiniRow({ task }: { task: ClientTaskWithCustomer }) {
  return (
    <div className="flex flex-col gap-1.5 border-b px-3 py-2.5 last:border-0">
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
      <span className="text-sm">{task.title}</span>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="font-normal text-muted-foreground">
          {TASK_CATEGORY_LABEL[task.category]}
        </Badge>
        <TaskStatusControl taskId={task.id} status={task.status} />
      </div>
    </div>
  )
}

function TaskColumn({
  title,
  tasks,
  tone,
}: {
  title: string
  tasks: ClientTaskWithCustomer[]
  tone?: "red"
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-2.5">
        <CardTitle className={cn("text-sm", tone === "red" && "text-red-600")}>
          {title} <span className="font-normal text-muted-foreground">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex max-h-96 flex-col overflow-y-auto p-0">
        {tasks.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">Görev yok.</p>
        ) : (
          tasks.map((task) => <TaskMiniRow key={task.id} task={task} />)
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Görevlerimi 3 sütuna böler: Dün (gecikmiş — son tarihi geçmiş her şey buraya
 * düşer, sadece tam olarak dün değil), Bugün (son tarihi bugün olan + hiç son
 * tarihi olmayanlar), Yarın (son tarihi yarın veya daha ileri). Böylece hiçbir
 * görev sessizce kaybolmaz.
 */
export function TasksByDay({
  tasks,
  todayIso,
}: {
  tasks: ClientTaskWithCustomer[]
  todayIso: string
}) {
  const overdue = tasks.filter((t) => t.due_date && t.due_date < todayIso)
  const dueToday = tasks.filter((t) => !t.due_date || t.due_date === todayIso)
  const upcoming = tasks.filter((t) => t.due_date && t.due_date > todayIso)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <TaskColumn title="Dün" tasks={overdue} tone="red" />
      <TaskColumn title="Bugün" tasks={dueToday} />
      <TaskColumn title="Yarın" tasks={upcoming} />
    </div>
  )
}
