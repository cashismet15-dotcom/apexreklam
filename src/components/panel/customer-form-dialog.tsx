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
import { createPanelCustomer, updatePanelCustomerInfo } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"
import type { Customer } from "@/lib/types"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Pick<Customer, "id" | "company_name" | "contact_name" | "phone" | "notes">
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const action = customer
    ? updatePanelCustomerInfo.bind(null, customer.id)
    : createPanelCustomer
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Müşteriyi Düzenle" : "Müşteri Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company_name">Firma Adı</Label>
            <Input
              id="company_name"
              name="company_name"
              defaultValue={customer?.company_name}
              required
            />
            <FieldError errors={state.fieldErrors?.company_name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact_name">Yetkili</Label>
            <Input
              id="contact_name"
              name="contact_name"
              defaultValue={customer?.contact_name}
              required
            />
            <FieldError errors={state.fieldErrors?.contact_name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={customer?.phone} required />
            <FieldError errors={state.fieldErrors?.phone} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Not (opsiyonel)</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={customer?.notes ?? undefined} />
            <FieldError errors={state.fieldErrors?.notes} />
          </div>

          {!customer ? (
            <p className="text-xs text-muted-foreground">
              Aylık ücret ve ödeme günü burada girilmiyor — kaydettikten sonra patron Muhasebe&apos;den
              tamamlayacak.
            </p>
          ) : null}

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
