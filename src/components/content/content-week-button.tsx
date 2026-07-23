"use client"

import { useActionState, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { upsertContentWeek } from "@/lib/actions/content"
import { initialActionState } from "@/lib/actions/shared"
import { CONTENT_STATUSES, CONTENT_STATUS_LABEL } from "@/lib/content"
import type { ContentWeek } from "@/lib/types"

interface ContentWeekButtonProps {
  customerId: string
  companyName: string
  weekStart: string
  currentWeek: ContentWeek | null
  size?: "sm" | "default"
  variant?: "default" | "outline"
  label?: string
}

export function ContentWeekButton({
  customerId,
  companyName,
  weekStart,
  currentWeek,
  size = "sm",
  variant = "outline",
  label = "Bu Haftayı Güncelle",
}: ContentWeekButtonProps) {
  const [open, setOpen] = useState(false)
  const action = upsertContentWeek.bind(null, customerId, weekStart)
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{companyName} · Bu Hafta</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Durum</Label>
              <Select name="status" defaultValue={currentWeek?.status ?? "talimat_bekliyor"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CONTENT_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.status} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">Not / Talimat</Label>
              <Textarea
                id="note"
                name="note"
                rows={3}
                defaultValue={currentWeek?.note ?? ""}
                placeholder="Bu haftaya özel not veya talimat..."
              />
              <FieldError errors={state.fieldErrors?.note} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_url">Video Linki (opsiyonel)</Label>
              <Input
                id="video_url"
                name="video_url"
                defaultValue={currentWeek?.video_url ?? ""}
                placeholder="https://..."
              />
              <FieldError errors={state.fieldErrors?.video_url} />
            </div>

            {state.status === "error" && !state.fieldErrors ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
