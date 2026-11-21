"use client"

import { useTransition } from "react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { removeFirmService, setOneTimePaid } from "@/lib/actions/firms"
import { SERVICE_BILLING_LABEL } from "@/lib/firms"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { FirmService } from "@/lib/types"

function Row({ item, canEdit, paid }: { item: FirmService; canEdit: boolean; paid: number }) {
  const [isPending, startTransition] = useTransition()
  const isOneTime = item.billing === "tek_seferlik"
  const remaining = Math.max(0, Number(item.price) - paid)

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{item.name}</span>
        <span className="text-xs text-muted-foreground">
          {SERVICE_BILLING_LABEL[item.billing]} · Başlangıç {formatDate(item.start_date)}
        </span>
        {isOneTime && canEdit ? (
          <span
            className={cn(
              "text-xs",
              item.paid_at ? "text-emerald-700" : "text-amber-700"
            )}
          >
            {item.paid_at
              ? `Tahsil edildi · ${formatDate(item.paid_at)}`
              : paid > 0
                ? `${formatCurrency(paid)} alındı · kalan ${formatCurrency(remaining)}`
                : `Tahsilat bekliyor${item.due_date ? ` · vade ${formatDate(item.due_date)}` : ""}`}
          </span>
        ) : null}
      </div>
      {canEdit ? (
        <>
          <span className="text-sm font-semibold">
            {formatCurrency(item.price)}
            {!isOneTime ? <span className="text-xs font-normal text-muted-foreground">/ay</span> : null}
          </span>
          {isOneTime ? (
            <Button
              variant={item.paid_at ? "ghost" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => {
                if (item.paid_at && !window.confirm(`"${item.name}" için alınan tüm ödemeler silinsin mi?`)) return
                startTransition(async () => void (await setOneTimePaid(item.id, !item.paid_at)))
              }}
            >
              {item.paid_at ? "Geri al" : (
                <>
                  <Check />
                  {paid > 0 ? "Kalanı tahsil et" : "Tahsil edildi"}
                </>
              )}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm(`"${item.name}" hizmetini bu firmadan kaldır?`)) return
              startTransition(async () => void (await removeFirmService(item.id)))
            }}
          >
            <X className="size-3.5" />
            <span className="sr-only">Kaldır</span>
          </Button>
        </>
      ) : null}
    </div>
  )
}

export function FirmServiceList({
  items,
  showAmounts,
  paidByService = {},
}: {
  items: FirmService[]
  showAmounts: boolean
  /** Tek seferlik hizmet başına şimdiye kadar alınan tutar. */
  paidByService?: Record<string, number>
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz hizmet almıyor.</p>
  }
  const monthly = items.filter((i) => i.billing === "aylik").reduce((a, i) => a + Number(i.price), 0)
  const oneTimeOpen = items
    .filter((i) => i.billing === "tek_seferlik" && !i.paid_at)
    .reduce((a, i) => a + Math.max(0, Number(i.price) - (paidByService[i.id] ?? 0)), 0)
  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y">
        {items.map((i) => (
          <Row key={i.id} item={i} canEdit={showAmounts} paid={paidByService[i.id] ?? 0} />
        ))}
      </div>
      {showAmounts && (monthly > 0 || oneTimeOpen > 0) ? (
        <div className="mt-2 flex flex-col gap-1 border-t pt-2 text-sm">
          {monthly > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aylık toplam</span>
              <span className="font-semibold">{formatCurrency(monthly)}</span>
            </div>
          ) : null}
          {oneTimeOpen > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bekleyen tek seferlik</span>
              <span className="font-semibold text-amber-700">{formatCurrency(oneTimeOpen)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
