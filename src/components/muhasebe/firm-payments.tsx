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

/** Ödeme Al formunda seçilebilecek bir borç kalemi. */
export interface PaymentTargetOption {
  /** "aylik:YYYY-MM" ya da "svc:<firm_service_id>" */
  key: string
  label: string
  remaining: number
}

const CUSTOM_MONTH = "aylik:diger"

function PaymentDialog({
  open,
  onOpenChange,
  firmId,
  firmName,
  options,
  defaultKey,
  hasMonthly,
  todayIso,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  firmId: string
  firmName: string
  options: PaymentTargetOption[]
  defaultKey?: string
  hasMonthly: boolean
  todayIso: string
}) {
  const [state, formAction, isPending] = useActionState(
    recordFirmPayment.bind(null, firmId),
    initialActionState
  )
  const initialKey = defaultKey ?? options[0]?.key ?? (hasMonthly ? CUSTOM_MONTH : "")
  const [key, setKey] = useState(initialKey)
  const selected = options.find((o) => o.key === key)
  const [amount, setAmount] = useState(selected ? String(selected.remaining) : "")

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function choose(next: string) {
    setKey(next)
    const opt = options.find((o) => o.key === next)
    if (opt) setAmount(String(opt.remaining))
  }

  const isCustomMonth = key === CUSTOM_MONTH
  const target = key.startsWith("aylik:") ? "aylik" : key.slice(4)
  const period = key.startsWith("aylik:") && !isCustomMonth ? key.slice(6) : undefined
  const leftover = selected ? Math.round((selected.remaining - (Number(amount) || 0)) * 100) / 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ödeme Al</DialogTitle>
          <DialogDescription>{firmName} — tamamını ya da bir kısmını girebilirsin, kalan borç olarak durur.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="target" value={target} />
          {period ? <input type="hidden" name="period" value={period} /> : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-target">Ne için?</Label>
            <select
              id="pay-target"
              value={key}
              onChange={(e) => choose(e.target.value)}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label} — kalan {formatCurrency(o.remaining)}
                </option>
              ))}
              {hasMonthly ? <option value={CUSTOM_MONTH}>Aylık ücret — başka bir ay (peşin vb.)</option> : null}
            </select>
          </div>

          {isCustomMonth ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-period">Hangi ayın ücreti</Label>
              <Input id="pay-period" name="period" type="month" defaultValue={todayIso.slice(0, 7)} required />
              <FieldError errors={state.fieldErrors?.period} />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-amount">Alınan Tutar (₺)</Label>
              <Input
                id="pay-amount"
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
              <Label htmlFor="pay-date">Ödeme Tarihi</Label>
              <Input id="pay-date" name="payment_date" type="date" defaultValue={todayIso} required />
              <FieldError errors={state.fieldErrors?.payment_date} />
            </div>
          </div>

          {selected && leftover > 0 ? (
            <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <span className="text-sm text-amber-800 dark:text-amber-300">
                {formatCurrency(leftover)} borç olarak kalacak.
              </span>
              <Label htmlFor="pay-promise" className="text-xs">
                Kalanı ne zaman ödeyecek? (opsiyonel — takvimde o güne düşer)
              </Label>
              <Input id="pay-promise" name="expected_remaining_date" type="date" min={todayIso} />
              <FieldError errors={state.fieldErrors?.expected_remaining_date} />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-note">Not (opsiyonel)</Label>
            <Input id="pay-note" name="note" placeholder="Örn. havale, nakit, kapora..." />
          </div>
          {state.status === "error" ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending || !key}>
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
  options: PaymentTargetOption[]
  defaultKey?: string
  hasMonthly: boolean
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
  serviceNames,
}: {
  payment: FirmPayment
  firmName?: string
  serviceNames?: Record<string, string>
}) {
  const [isPending, startTransition] = useTransition()
  const label = payment.period
    ? `${formatPeriodLabel(payment.period)} ücreti`
    : (payment.firm_service_id && serviceNames?.[payment.firm_service_id]) || payment.note || "Tek seferlik"
  const extra = [
    payment.period && payment.note ? payment.note : null,
    payment.expected_remaining_date ? `kalan için söz: ${formatDate(payment.expected_remaining_date)}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

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
          {extra ? ` · ${extra}` : ""}
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
          if (!window.confirm("Bu ödeme kaydı silinsin mi? Tutar tekrar borç olarak görünür.")) return
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
  serviceNames,
  emptyLabel = "Henüz ödeme alınmadı.",
}: {
  payments: FirmPayment[]
  /** Verilirse (muhasebe sayfası) her satırda firma adı gösterilir. */
  firmNames?: Record<string, string>
  serviceNames?: Record<string, string>
  emptyLabel?: string
}) {
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return (
    <div className="flex flex-col divide-y">
      {payments.map((p) => (
        <PaymentRow key={p.id} payment={p} firmName={firmNames?.[p.firm_id]} serviceNames={serviceNames} />
      ))}
    </div>
  )
}
