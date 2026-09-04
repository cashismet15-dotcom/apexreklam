"use client"

import { useState, useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateBugStatus } from "@/lib/actions/panel"
import { BUG_STATUSES, BUG_STATUS_LABEL, BUG_STATUS_STYLE } from "@/lib/panel"
import type { AiBugStatus } from "@/lib/types"

export function BugStatusControl({ bugId, status }: { bugId: string; status: AiBugStatus }) {
  const [current, setCurrent] = useState(status)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(value: string) {
    const next = value as AiBugStatus
    const previous = current
    setCurrent(next)
    setError(null)
    startTransition(async () => {
      const result = await updateBugStatus(bugId, next)
      if (result.status === "error") {
        setCurrent(previous)
        setError(result.message ?? "Bir hata oluştu.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Select value={current} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger size="sm" className={BUG_STATUS_STYLE[current]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BUG_STATUSES.map((key) => (
            <SelectItem key={key} value={key}>
              {BUG_STATUS_LABEL[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
