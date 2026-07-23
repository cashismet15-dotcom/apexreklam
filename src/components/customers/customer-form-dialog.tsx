"use client"

import { useActionState, useEffect } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldError } from "@/components/shared/field-error"
import { createCustomer, updateCustomer } from "@/lib/actions/customers"
import { initialActionState } from "@/lib/actions/shared"
import type { Customer } from "@/lib/types"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: CustomerFormDialogProps) {
  const action = customer ? updateCustomer.bind(null, customer.id) : createCustomer
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="monthly_fee">Aylık Ücret (₺)</Label>
              <Input
                id="monthly_fee"
                name="monthly_fee"
                type="number"
                min={0}
                step="0.01"
                defaultValue={customer?.monthly_fee}
                required
              />
              <FieldError errors={state.fieldErrors?.monthly_fee} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment_day">Her Ayın Kaçında</Label>
              <Input
                id="payment_day"
                name="payment_day"
                type="number"
                min={1}
                max={31}
                defaultValue={customer?.payment_day}
                required
              />
              <FieldError errors={state.fieldErrors?.payment_day} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start_date">Başlangıç Tarihi</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={customer?.start_date}
              required
            />
            <FieldError errors={state.fieldErrors?.start_date} />
          </div>

          {customer ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Durum</Label>
              {customer.status === "donduruldu" ? (
                <>
                  <Input value="Donduruldu" disabled readOnly />
                  <input type="hidden" name="status" value="donduruldu" />
                  <span className="text-xs text-muted-foreground">
                    Aktif etmek için müşteri listesindeki &quot;Devam Ettir&quot; işlemini kullanın.
                  </span>
                </>
              ) : (
                <Select name="status" defaultValue={customer.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="pasif">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <FieldError errors={state.fieldErrors?.status} />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Not</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={customer?.notes ?? ""}
            />
            <FieldError errors={state.fieldErrors?.notes} />
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
