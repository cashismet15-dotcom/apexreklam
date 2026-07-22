"use client"

import { useActionState, useEffect, useState } from "react"

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
import { createPayment, updatePayment } from "@/lib/actions/payments"
import { initialActionState } from "@/lib/actions/shared"
import { AY_ADLARI, formatCurrency } from "@/lib/format"
import type { Customer, Payment } from "@/lib/types"

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Pick<Customer, "id" | "company_name" | "contact_name" | "monthly_fee">[]
  payment?: Payment
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  customers,
  payment,
}: PaymentFormDialogProps) {
  const now = new Date()
  const action = payment ? updatePayment.bind(null, payment.id) : createPayment
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const [amount, setAmount] = useState<string>(
    payment ? String(payment.amount) : ""
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(
    payment?.customer_id
  )

  useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function handleCustomerChange(customerId: string) {
    setSelectedCustomerId(customerId)
    const customer = customers.find((c) => c.id === customerId)
    if (customer) setAmount(String(customer.monthly_fee))
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const amountValue = Number(amount)
  const isPartial =
    !!selectedCustomer &&
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    amountValue < selectedCustomer.monthly_fee
  const remaining = isPartial ? selectedCustomer.monthly_fee - amountValue : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payment ? "Ödemeyi Düzenle" : "Ödeme Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer_id">Müşteri</Label>
            <Select
              name="customer_id"
              defaultValue={payment?.customer_id}
              onValueChange={handleCustomerChange}
            >
              <SelectTrigger id="customer_id" className="w-full">
                <SelectValue placeholder="Müşteri seçin" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name} · {c.contact_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state.fieldErrors?.customer_id} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Tutar (₺)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <FieldError errors={state.fieldErrors?.amount} />
          </div>

          {isPartial ? (
            <div className="flex flex-col gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Label htmlFor="expected_remaining_date">
                Kısmi ödeme: kalan {formatCurrency(remaining)} ne zaman tahsil edilecek?
              </Label>
              <Input
                id="expected_remaining_date"
                name="expected_remaining_date"
                type="date"
                defaultValue={payment?.expected_remaining_date ?? ""}
                required
              />
              <FieldError errors={state.fieldErrors?.expected_remaining_date} />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment_date">Ödeme Tarihi</Label>
            <Input
              id="payment_date"
              name="payment_date"
              type="date"
              defaultValue={payment?.payment_date ?? now.toISOString().slice(0, 10)}
              required
            />
            <FieldError errors={state.fieldErrors?.payment_date} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="month">Hangi Ay İçin</Label>
              <Select name="month" defaultValue={String(payment?.month ?? now.getMonth() + 1)}>
                <SelectTrigger id="month" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AY_ADLARI.map((ad, index) => (
                    <SelectItem key={ad} value={String(index + 1)}>
                      {ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.month} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="year">Yıl</Label>
              <Input
                id="year"
                name="year"
                type="number"
                defaultValue={payment?.year ?? now.getFullYear()}
                required
              />
              <FieldError errors={state.fieldErrors?.year} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Not</Label>
            <Textarea id="note" name="note" rows={2} defaultValue={payment?.note ?? ""} />
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
