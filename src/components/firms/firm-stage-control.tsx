"use client"

import { useState, useTransition } from "react"
import { Check, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react"

import { ConvertFirmDialog } from "@/components/firms/convert-firm-dialog"
import { Button } from "@/components/ui/button"
import { setFirmStage } from "@/lib/actions/firms"
import { FIRM_STAGE_LABEL } from "@/lib/firms"
import { cn } from "@/lib/utils"
import type { FirmStage, Service } from "@/lib/types"

const STEPS: FirmStage[] = ["ilk_gorusme", "teklif_verildi"]

/** Funnel adımları: İlk Görüşme → Teklif Verildi → Olumlu / Olumsuz. */
export function FirmStageControl({
  firmId,
  stage,
  services,
  canConvert,
  defaultStartDate,
}: {
  firmId: string
  stage: FirmStage
  services: Service[]
  /** Olumlu (Müşteri Yap) fiyat gerektirdiği için sadece owner'da. */
  canConvert: boolean
  defaultStartDate: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [convertOpen, setConvertOpen] = useState(false)

  function move(next: FirmStage) {
    setError(null)
    startTransition(async () => {
      const result = await setFirmStage(firmId, next)
      if (result.status === "error") setError(result.message ?? "Güncellenemedi.")
    })
  }

  const reached = (s: FirmStage) =>
    stage === "olumlu" || stage === "olumsuz" || STEPS.indexOf(stage) >= STEPS.indexOf(s)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            {i > 0 ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
            <button
              type="button"
              disabled={isPending || stage === "olumlu"}
              onClick={() => move(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default",
                stage === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : reached(s)
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted"
              )}
            >
              {reached(s) && stage !== s ? <Check className="size-3" /> : null}
              {FIRM_STAGE_LABEL[s]}
            </button>
          </div>
        ))}
        <ChevronRight className="size-4 text-muted-foreground" />
        {stage === "olumlu" ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Olumlu — Müşterimiz
          </span>
        ) : stage === "olumsuz" ? (
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Olumsuz
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sonuç bekleniyor</span>
        )}
      </div>

      {stage !== "olumlu" ? (
        <div className="flex flex-wrap gap-2">
          {canConvert ? (
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isPending}
              onClick={() => setConvertOpen(true)}
            >
              <ThumbsUp />
              Olumlu — Müşteri Yap
            </Button>
          ) : null}
          {stage !== "olumsuz" ? (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => move("olumsuz")}>
              <ThumbsDown />
              Olumsuz
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => move("ilk_gorusme")}>
              Tekrar takibe al
            </Button>
          )}
        </div>
      ) : canConvert ? (
        <div>
          <Button size="sm" variant="outline" onClick={() => setConvertOpen(true)}>
            Hizmet Ekle
          </Button>
        </div>
      ) : null}

      {!canConvert && stage !== "olumlu" ? (
        <p className="text-xs text-muted-foreground">
          Olumlu sonuçlanınca İsmet hizmet ve fiyatı seçip müşteriye çevirir.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Sadece açıkken mount — her açılışta seçim ve form durumu sıfırdan başlar. */}
      {canConvert && convertOpen ? (
        <ConvertFirmDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          firmId={firmId}
          services={services}
          defaultStartDate={defaultStartDate}
          isAddingMore={stage === "olumlu"}
        />
      ) : null}
    </div>
  )
}
