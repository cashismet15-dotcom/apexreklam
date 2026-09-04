"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { TableCell, TableRow } from "@/components/ui/table"
import { DayCheckbox } from "@/components/daily-tasks/day-checkbox"
import { removeTask } from "@/lib/actions/daily-tasks"
import type { DailyTaskCell } from "@/lib/daily-tasks-data"

interface TaskRowProps {
  taskId: string
  title: string
  cells: DailyTaskCell[]
}

export function TaskRow({ taskId, title, cells }: TaskRowProps) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await removeTask(taskId)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <TableRow className="group/task">
      <TableCell className="max-w-48 truncate text-sm font-normal" title={title}>
        {title}
      </TableCell>

      {cells.map((cell) => (
        <TableCell key={cell.date} className="text-center">
          <DayCheckbox
            taskId={taskId}
            date={cell.date}
            initialDone={cell.done}
            overdue={cell.overdue}
          />
        </TableCell>
      ))}

      <TableCell className="w-8">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/task:opacity-100 disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Görevi sil</span>
        </button>
      </TableCell>
    </TableRow>
  )
}
