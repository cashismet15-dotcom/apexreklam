"use client"

import { useActionState, useEffect, useState } from "react"
import { BellRing } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/shared/field-error"
import { Textarea } from "@/components/ui/textarea"
import { sendYakamozReminder } from "@/lib/actions/yakamoz-whatsapp"
import { initialActionState } from "@/lib/actions/shared"

function defaultReminderText(customerName: string | null): string {
  const selamlama = customerName ? `Merhaba ${customerName}` : "Merhaba"
  return `${selamlama}, son halı yıkama hizmetinizin üzerinden biraz zaman geçti. Yeniden randevu almak ister misiniz?`
}

export function YakamozReminderButton({
  phone,
  customerName,
}: {
  phone: string
  customerName: string | null
}) {
  const [open, setOpen] = useState(false)
  const action = sendYakamozReminder.bind(null, phone, customerName)
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") setOpen(false)
  }, [state])

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <BellRing />
        Hatırlatma Gönder
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent key={open ? "open" : "closed"}>
          <DialogHeader>
            <DialogTitle>Hatırlatma Gönder</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-3">
            <Textarea
              name="body"
              rows={4}
              defaultValue={defaultReminderText(customerName)}
              required
            />
            <FieldError errors={state.fieldErrors?.body} />
            {state.status === "error" ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Gönderiliyor..." : "Gönder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
