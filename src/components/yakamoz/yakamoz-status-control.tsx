"use client"

import { useState, useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateYakamozJobStatus } from "@/lib/actions/yakamoz-jobs"
import { YAKAMOZ_STATUS_LABELS, YAKAMOZ_STATUS_ORDER } from "@/lib/yakamoz"
import type { YakamozJobStatus } from "@/lib/types"

const STATUS_TRIGGER_CLASS: Record<YakamozJobStatus, string> = {
  siparis_alindi: "bg-amber-50 text-amber-700 border-amber-200",
  yikamada: "bg-blue-50 text-blue-700 border-blue-200",
  yolda: "bg-violet-50 text-violet-700 border-violet-200",
  bitti: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

export function YakamozStatusControl({
  jobId,
  status,
}: {
  jobId: string
  status: YakamozJobStatus
}) {
  const [current, setCurrent] = useState(status)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(value: string) {
    const next = value as YakamozJobStatus
    const previous = current
    setCurrent(next)
    setError(null)
    startTransition(async () => {
      const result = await updateYakamozJobStatus(jobId, next)
      if (result.status === "error") {
        setCurrent(previous)
        setError(result.message ?? "Bir hata oluştu.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Select value={current} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger size="sm" className={STATUS_TRIGGER_CLASS[current]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YAKAMOZ_STATUS_ORDER.map((key) => (
            <SelectItem key={key} value={key}>
              {YAKAMOZ_STATUS_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
