"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import Link from "next/link"

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
import { convertFirmToCustomer } from "@/lib/actions/firms"
import { initialActionState } from "@/lib/actions/shared"
import { DEFAULT_START_DELAY_DAYS, SERVICE_BILLING_LABEL } from "@/lib/firms"
import { formatCurrency } from "@/lib/format"
import type { Service } from "@/lib/types"

/** Olumlu → hizmet(ler) seç (fiyat katalogdan gelir, değiştirilebilir), başlangıç ve ilk ödeme tarihi. */
export function ConvertFirmDialog({
  open,
  onOpenChange,
  firmId,
  services,
  defaultStartDate,
  isAddingMore,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  firmId: string
  services: Service[]
  defaultStartDate: string
  isAddingMore: boolean
}) {
  const [state, formAction, isPending] = useActionState(
    convertFirmToCustomer.bind(null, firmId),
    initialActionState
  )
  // service_id -> fiyat (string, input için); seçili değilse yok.
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [firstPaymentDate, setFirstPaymentDate] = useState(defaultStartDate)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function toggle(service: Service) {
    setSelected((prev) => {
      const next = { ...prev }
      if (service.id in next) delete next[service.id]
      else next[service.id] = String(service.price)
      return next
    })
  }

  const items = Object.entries(selected).map(([service_id, price]) => ({ service_id, price }))
  const totals = useMemo(() => {
    let monthly = 0
    let oneTime = 0
    for (const s of services) {
      if (!(s.id in selected)) continue
      const price = Number(selected[s.id]) || 0
      if (s.billing === "aylik") monthly += price
      else oneTime += price
    }
    return { monthly, oneTime }
  }, [services, selected])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isAddingMore ? "Hizmet Ekle" : "Olumlu — Müşteri Yap"}</DialogTitle>
          <DialogDescription>
            Hizmetleri seç; fiyatlar Hizmetler&apos;den gelir, bu firmaya özel değiştirebilirsin.
            Aylık hizmetlerin toplamı Muhasebe&apos;de aylık ücret olur.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          {services.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Henüz hizmet yok.{" "}
              <Link href="/panel/hizmetler" className="text-primary hover:underline">
                Önce Hizmetler&apos;e ekle →
              </Link>
            </p>
          ) : (
            <div className="flex flex-col divide-y rounded-lg border">
              {services.map((s) => {
                const isOn = s.id in selected
                return (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      id={`svc-${s.id}`}
                      checked={isOn}
                      onChange={() => toggle(s)}
                      className="size-4 accent-primary"
                    />
                    <label htmlFor={`svc-${s.id}`} className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {SERVICE_BILLING_LABEL[s.billing]} · Liste: {formatCurrency(s.price)}
                      </span>
                    </label>
                    {isOn ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        aria-label={`${s.name} fiyatı`}
                        className="w-28"
                        value={selected[s.id]}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start_date">Çalışmaya Başlama</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first_payment_date">İlk Ödeme</Label>
              <Input
                id="first_payment_date"
                name="first_payment_date"
                type="date"
                value={firstPaymentDate}
                onChange={(e) => setFirstPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>
          {!isAddingMore ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              Varsayılan: bugünden {DEFAULT_START_DELAY_DAYS} gün sonra. Sonraki ödemeler her ayın
              aynı günü.
            </p>
          ) : null}

          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aylık toplam</span>
              <span className="font-semibold">{formatCurrency(totals.monthly)}</span>
            </div>
            {totals.oneTime > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tek seferlik toplam</span>
                <span className="font-semibold">{formatCurrency(totals.oneTime)}</span>
              </div>
            ) : null}
          </div>

          {state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending || items.length === 0}>
              {isPending ? "Kaydediliyor..." : isAddingMore ? "Hizmetleri Ekle" : "Müşteri Yap"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
