"use client"

import { useState, useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateTaskStatus } from "@/lib/actions/panel"
import { TASK_STATUSES, TASK_STATUS_LABEL, TASK_STATUS_STYLE } from "@/lib/panel"
import type { ClientTaskStatus } from "@/lib/types"

export function TaskStatusControl({ taskId, status }: { taskId: string; status: ClientTaskStatus }) {
  const [current, setCurrent] = useState(status)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(value: string) {
    const next = value as ClientTaskStatus
    const previous = current
    setCurrent(next)
    setError(null)
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, next)
      if (result.status === "error") {
        setCurrent(previous)
        setError(result.message ?? "Bir hata oluştu.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Select value={current} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger size="sm" className={TASK_STATUS_STYLE[current]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((key) => (
            <SelectItem key={key} value={key}>
              {TASK_STATUS_LABEL[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
