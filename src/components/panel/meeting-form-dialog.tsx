"use client"

import { useActionState, useEffect } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { createMeeting } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"
import { TEAM_MEMBERS } from "@/lib/panel"
import type { TeamMemberRole } from "@/lib/types"

interface MeetingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultParticipant: TeamMemberRole
}

export function MeetingFormDialog({
  open,
  onOpenChange,
  defaultParticipant,
}: MeetingFormDialogProps) {
  const [state, formAction, isPending] = useActionState(createMeeting, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplantı Ekle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" placeholder="örn. Eylül strateji toplantısı" required />
            <FieldError errors={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting_at">Tarih ve Saat</Label>
            <Input id="meeting_at" name="meeting_at" type="datetime-local" required />
            <FieldError errors={state.fieldErrors?.meeting_at} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Katılımcılar</Label>
            <div className="flex flex-wrap gap-3">
              {TEAM_MEMBERS.map((m) => (
                <label key={m.value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.value}
                    defaultChecked={m.value === defaultParticipant}
                    className="size-4 rounded border-input accent-primary"
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <FieldError errors={state.fieldErrors?.participants} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="link">Link (opsiyonel)</Label>
            <Input id="link" name="link" placeholder="Google Meet / Zoom linki" />
            <FieldError errors={state.fieldErrors?.link} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Not (opsiyonel)</Label>
            <Textarea id="note" name="note" rows={2} />
            <FieldError errors={state.fieldErrors?.note} />
          </div>

          {state.status === "error" && !state.fieldErrors ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
