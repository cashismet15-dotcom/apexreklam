"use client"

import { useActionState, useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addBlockedDate, deleteBlockedDate } from "@/lib/actions/availability"
import { initialActionState } from "@/lib/actions/shared"
import type { BookingBlockedDate } from "@/lib/types"

function BlockedDateRow({ item }: { item: BookingBlockedDate }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteBlockedDate(item.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  const dateLabel = new Date(`${item.blocked_date}T00:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  })

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{dateLabel}</span>
        {item.note ? <span className="text-xs text-muted-foreground">{item.note}</span> : null}
      </div>
      <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isDeleting}>
        <Trash2 className="size-3.5" />
        <span className="sr-only">Kaldır</span>
      </Button>
    </div>
  )
}

export function BlockedDates({ dates }: { dates: BookingBlockedDate[] }) {
  const [state, formAction, isPending] = useActionState(addBlockedDate, initialActionState)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="blocked_date">Tarih</Label>
            <Input id="blocked_date" name="blocked_date" type="date" required />
            <FieldError errors={state.fieldErrors?.blocked_date} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Not (opsiyonel)</Label>
            <Input id="note" name="note" placeholder="örn. Tatil" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Ekleniyor..." : "Ekle"}
          </Button>
        </form>
        {state.status === "error" && !state.fieldErrors ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}

        {dates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Kapalı gün eklenmedi.</p>
        ) : (
          <div className="flex flex-col divide-y rounded-lg border">
            {dates.map((item) => (
              <BlockedDateRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
