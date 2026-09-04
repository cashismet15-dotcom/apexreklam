import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TaskStatusControl } from "@/components/panel/task-status-control"
import { formatDate } from "@/lib/format"
import { TASK_CATEGORY_LABEL, isTaskOverdue } from "@/lib/panel"
import type { ClientTaskWithCustomer } from "@/lib/types"
import { cn } from "@/lib/utils"

export function OpenTasksList({
  tasks,
  todayIso,
}: {
  tasks: ClientTaskWithCustomer[]
  todayIso: string
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-20 items-center justify-center text-sm text-muted-foreground">
          Açık görev yok.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {tasks.map((task) => {
          const overdue = isTaskOverdue(task, todayIso)
          return (
            <div key={task.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/panel/${task.customer_id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {task.customer.company_name}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{task.title}</span>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {TASK_CATEGORY_LABEL[task.category]}
                  </Badge>
                </div>
                {task.due_date ? (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      overdue ? "font-medium text-red-600" : "text-muted-foreground"
                    )}
                  >
                    {overdue ? <AlertTriangle className="size-3" /> : null}
                    {overdue ? "Süresi geçti" : "Son tarih"}: {formatDate(task.due_date)}
                  </span>
                ) : null}
              </div>

              <TaskStatusControl taskId={task.id} status={task.status} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
