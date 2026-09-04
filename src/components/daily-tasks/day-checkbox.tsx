"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, Check } from "lucide-react"

import { setTaskDone } from "@/lib/actions/daily-tasks"
import { cn } from "@/lib/utils"

interface DayCheckboxProps {
  taskId: string
  date: string
  initialDone: boolean
  /** Gün geçmişte kaldı ve işaretlenmedi — kırmızı uyarı gösterilir. */
  overdue: boolean
}

export function DayCheckbox({ taskId, date, initialDone, overdue }: DayCheckboxProps) {
  const [done, setDone] = useState(initialDone)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !done
    setDone(next)
    startTransition(async () => {
      const result = await setTaskDone(taskId, date, next)
      if (result.status === "error") setDone(!next)
    })
  }

  const showOverdue = overdue && !done

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      disabled={isPending}
      onClick={handleToggle}
      title={showOverdue ? "Bu gün tamamlanmadı" : undefined}
      className={cn(
        "mx-auto flex size-5 items-center justify-center rounded-md border transition-colors disabled:opacity-60",
        done
          ? "border-primary bg-primary text-primary-foreground"
          : showOverdue
            ? "border-red-300 bg-red-50 hover:border-red-400"
            : "border-input bg-background hover:border-primary/50"
      )}
    >
      {done ? (
        <Check className="size-3.5" />
      ) : showOverdue ? (
        <AlertTriangle className="size-3 text-red-500" />
      ) : null}
    </button>
  )
}
