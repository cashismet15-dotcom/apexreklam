"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AddAttachmentButton } from "@/components/panel/add-attachment-button"
import { TaskAttachments } from "@/components/panel/task-attachments"
import { TaskStatusControl } from "@/components/panel/task-status-control"
import { deleteClientTask } from "@/lib/actions/panel"
import { formatDate } from "@/lib/format"
import { TASK_CATEGORY_LABEL, TEAM_MEMBER_LABEL, isTaskOverdue } from "@/lib/panel"
import type { ClientTaskWithAttachments } from "@/lib/types"
import { cn } from "@/lib/utils"

function TaskRow({ task, todayIso }: { task: ClientTaskWithAttachments; todayIso: string }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const overdue = isTaskOverdue(task, todayIso)

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteClientTask(task.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{task.title}</span>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {TASK_CATEGORY_LABEL[task.category]}
          </Badge>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {TEAM_MEMBER_LABEL[task.assigned_to]}
          </Badge>
        </div>
        {task.description ? (
          <p className="text-xs text-muted-foreground">{task.description}</p>
        ) : null}
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
        <TaskAttachments attachments={task.attachments} />
        <AddAttachmentButton taskId={task.id} />
      </div>

      <TaskStatusControl taskId={task.id} status={task.status} />

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Görevi sil</span>
      </button>
    </div>
  )
}

export function TaskList({
  tasks,
  todayIso,
  emptyLabel = "Henüz görev eklenmedi.",
}: {
  tasks: ClientTaskWithAttachments[]
  todayIso: string
  emptyLabel?: string
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} todayIso={todayIso} />
        ))}
      </CardContent>
    </Card>
  )
}
