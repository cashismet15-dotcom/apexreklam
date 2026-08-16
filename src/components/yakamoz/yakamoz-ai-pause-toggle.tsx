"use client"

import { useState, useTransition } from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toggleYakamozAiPaused } from "@/lib/actions/yakamoz-whatsapp"

export function YakamozAiPauseToggle({
  contactId,
  aiPaused,
}: {
  contactId: string
  aiPaused: boolean
}) {
  const [paused, setPaused] = useState(aiPaused)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: boolean) {
    setPaused(next)
    startTransition(async () => {
      const result = await toggleYakamozAiPaused(contactId, next)
      if (result.status === "error") setPaused(!next)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch id="ai-paused" checked={paused} onCheckedChange={handleChange} disabled={isPending} />
      <Label htmlFor="ai-paused" className="text-sm font-normal text-muted-foreground">
        {paused ? "YZ duraklatıldı (sen devredesin)" : "YZ aktif"}
      </Label>
    </div>
  )
}
