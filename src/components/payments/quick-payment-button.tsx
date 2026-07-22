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
import { Textarea } from "@/components/ui/textarea"
import { quickReceivePayment } from "@/lib/actions/payments"
import { initialActionState } from "@/lib/actions/shared"
import { formatCurrency } from "@/lib/format"
import type { Customer } from "@/lib/types"

interface QuickPaymentButtonProps {
  customer: Pick<Customer, "id" | "company_name" | "monthly_fee">
  /** Aktif döngü için gerçekten borçlu olunan tutar (kapora sonrası kalan olabilir). Verilmezse tam aylık ücret varsayılır. */
  remainingAmount?: number
  size?: "sm" | "default"
  variant?: "default" | "outline"
}

function defaultRemainingDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

export function QuickPaymentButton({
  customer,
  remainingAmount,
  size = "sm",
  variant = "default",
}: QuickPaymentButtonProps) {
  const [open, setOpen] = useState(false)
  const action = quickReceivePayment.bind(null, customer.id)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const targetAmount = remainingAmount ?? customer.monthly_fee
  const [amount, setAmount] = useState<string>(String(targetAmount))

  const amountValue = Number(amount)
  const isPartial = Number.isFinite(amountValue) && amountValue > 0 && amountValue < targetAmount
  const remaining = isPartial ? targetAmount - amountValue : 0

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        💰 Ödeme Al
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{customer.company_name} · Ödeme Al</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Ödeme Tutarı (₺)</Label>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment_date">Ödeme Tarihi</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
              <FieldError errors={state.fieldErrors?.payment_date} />
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
                  defaultValue={defaultRemainingDate()}
                  required
                />
                <FieldError errors={state.fieldErrors?.expected_remaining_date} />
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">Not (opsiyonel)</Label>
              <Textarea id="note" name="note" rows={2} />
              <FieldError errors={state.fieldErrors?.note} />
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
