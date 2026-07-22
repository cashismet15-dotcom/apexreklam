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
import { createCrmContact } from "@/lib/actions/crm"
import { initialActionState } from "@/lib/actions/shared"

export function NewContactButton() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createCrmContact, initialActionState)

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Yeni Kişi</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kişi Ekle</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">İsim</Label>
              <Input id="name" name="name" required />
              <FieldError errors={state.fieldErrors?.name} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Telefon (WhatsApp)</Label>
              <Input id="phone" name="phone" placeholder="905xxxxxxxxx" required />
              <FieldError errors={state.fieldErrors?.phone} />
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
