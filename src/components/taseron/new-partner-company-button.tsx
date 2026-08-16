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
import { createPartnerCompany } from "@/lib/actions/partner-companies"
import { initialActionState } from "@/lib/actions/shared"

export function NewPartnerCompanyButton() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createPartnerCompany, initialActionState)

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Yeni Firma</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent key={open ? "open" : "closed"}>
          <DialogHeader>
            <DialogTitle>Yeni Taşeron Firma</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Firma Adı</Label>
              <Input id="name" name="name" required />
              <FieldError errors={state.fieldErrors?.name} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input id="username" name="username" required />
              <FieldError errors={state.fieldErrors?.username} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="passcode">Şifre</Label>
              <Input id="passcode" name="passcode" type="text" required />
              <FieldError errors={state.fieldErrors?.passcode} />
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
