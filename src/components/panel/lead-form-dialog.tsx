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
import { createLead } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"

export function LeadFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, formAction, isPending] = useActionState(createLead, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Potansiyel Müşteri Ekle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">İsim (opsiyonel)</Label>
            <Input id="name" name="name" placeholder="Bilmiyorsan boş bırak" />
            <FieldError errors={state.fieldErrors?.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" placeholder="05xx xxx xx xx" required />
            <FieldError errors={state.fieldErrors?.phone} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Not (opsiyonel)</Label>
            <Textarea id="note" name="note" rows={3} />
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
