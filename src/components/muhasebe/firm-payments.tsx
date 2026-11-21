"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Trash2, Wallet } from "lucide-react"

import { FieldError } from "@/components/shared/field-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteFirmPayment, recordFirmPayment } from "@/lib/actions/firms"
import { initialActionState } from "@/lib/actions/shared"
import { formatCurrency, formatDate } from "@/lib/format"
import { formatPeriodLabel } from "@/lib/panel"
import type { FirmPayment } from "@/lib/types"

function PaymentDialog({
  open,
  onOpenChange,
  firmId,
  firmName,
  defaultAmount,
  defaultPeriod,
  todayIso,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  firmId: string
  firmName: string
  defaultAmount: number
  defaultPeriod: string
  todayIso: string
}) {
  const [state, formAction, isPending] = useActionState(
    recordFirmPayment.bind(null, firmId),
    initialActionState
  )

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ödeme Al</DialogTitle>
          <DialogDescription>{firmName} — aylık ücret ödemesi. Kısmi ödeme / kapora da girebilirsin.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-amount">Tutar (₺)</Label>
              <Input
                id="pay-amount"
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={defaultAmount || ""}
                required
              />
              <FieldError errors={state.fieldErrors?.amount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-period">Hangi ayın ücreti</Label>
              <Input id="pay-period" name="period" type="month" defaultValue={defaultPeriod} required />
              <FieldError errors={state.fieldErrors?.period} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-date">Ödeme Tarihi</Label>
            <Input id="pay-date" name="payment_date" type="date" defaultValue={todayIso} required />
            <FieldError errors={state.fieldErrors?.payment_date} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-note">Not (opsiyonel)</Label>
            <Input id="pay-note" name="note" placeholder="Örn. havale, nakit, kapora..." />
          </div>
          {state.status === "error" ? <p className="text-sm text-destructive">{state.message}</p> : null}
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

export function RecordPaymentButton({
  variant = "default",
  ...dialogProps
}: {
  firmId: string
  firmName: string
  defaultAmount: number
  defaultPeriod: string
  todayIso: string
  variant?: "default" | "outline"
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        <Wallet />
        Ödeme Al
      </Button>
      {/* Sadece açıkken mount — her açılışta form sıfırdan başlar. */}
      {open ? <PaymentDialog open={open} onOpenChange={setOpen} {...dialogProps} /> : null}
    </>
  )
}

function PaymentRow({
  payment,
  firmName,
}: {
  payment: FirmPayment
  firmName?: string
}) {
  const [isPending, startTransition] = useTransition()
  const label = payment.period ? `${formatPeriodLabel(payment.period)} ücreti` : (payment.note ?? "Tek seferlik")
  return (
    <div className="group flex items-center gap-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col">
        {firmName ? (
          <Link href={`/panel/firmalar/${payment.firm_id}`} className="truncate text-sm font-medium hover:underline">
            {firmName}
          </Link>
        ) : null}
        <span className={firmName ? "truncate text-xs text-muted-foreground" : "truncate text-sm"}>
          {label}
          {payment.period && payment.note ? ` · ${payment.note}` : ""}
        </span>
        {!firmName ? (
          <span className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</span>
        ) : null}
      </div>
      {firmName ? (
        <span className="hidden text-xs text-muted-foreground sm:inline">{formatDate(payment.payment_date)}</span>
      ) : null}
      <span className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
        {formatCurrency(payment.amount)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-60 group-hover:opacity-100"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm("Bu ödeme kaydı silinsin mi?")) return
          startTransition(async () => void (await deleteFirmPayment(payment.id)))
        }}
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Sil</span>
      </Button>
    </div>
  )
}

export function FirmPaymentList({
  payments,
  firmNames,
  emptyLabel = "Henüz ödeme alınmadı.",
}: {
  payments: FirmPayment[]
  /** Verilirse (muhasebe sayfası) her satırda firma adı gösterilir. */
  firmNames?: Record<string, string>
  emptyLabel?: string
}) {
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return (
    <div className="flex flex-col divide-y">
      {payments.map((p) => (
        <PaymentRow key={p.id} payment={p} firmName={firmNames?.[p.firm_id]} />
      ))}
    </div>
  )
}
