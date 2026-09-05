"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { updateAvailability } from "@/lib/actions/availability"
import { initialActionState } from "@/lib/actions/shared"
import type { BookingAvailability } from "@/lib/types"

const WEEKDAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

export function AvailabilityForm({ availability }: { availability: BookingAvailability[] }) {
  const [state, formAction, isPending] = useActionState(updateAvailability, initialActionState)
  const rows = [0, 1, 2, 3, 4, 5, 6].map(
    (weekday) => availability.find((a) => a.weekday === weekday) ?? {
      weekday,
      is_open: true,
      start_time: "09:00",
      end_time: "19:00",
      updated_at: "",
    }
  )
  const [openState, setOpenState] = useState<Record<number, boolean>>(
    Object.fromEntries(rows.map((r) => [r.weekday, r.is_open]))
  )

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col divide-y">
            {rows.map((row) => {
              const isOpen = openState[row.weekday]
              return (
                <div key={row.weekday} className="flex flex-wrap items-center gap-3 py-3">
                  <label className="flex w-36 shrink-0 items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      name={`is_open_${row.weekday}`}
                      checked={isOpen}
                      onChange={(e) => {
                        const next = e.target.checked
                        if (!next) {
                          const dayLabel = WEEKDAY_LABELS[row.weekday]
                          const ok = window.confirm(
                            `${dayLabel} gününü kapatmak HER HAFTA bu günü kalıcı olarak kapatır.\n\n` +
                              `Sadece belirli bir tarih için (ör. sadece bu haftaki ${dayLabel}) kapatmak istiyorsanız ` +
                              `İptal'e basın ve aşağıdaki "Kapalı Günler"den o tarihi ekleyin.\n\n` +
                              `Yine de her hafta ${dayLabel} günü kalıcı olarak kapalı olsun mu?`
                          )
                          if (!ok) return
                        }
                        setOpenState((prev) => ({ ...prev, [row.weekday]: next }))
                      }}
                      className="size-4 rounded border-input accent-primary"
                    />
                    {WEEKDAY_LABELS[row.weekday]}
                  </label>
                  {isOpen ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        name={`start_time_${row.weekday}`}
                        defaultValue={row.start_time.slice(0, 5)}
                        className="w-28"
                      />
                      <span className="text-sm text-muted-foreground">—</span>
                      <Input
                        type="time"
                        name={`end_time_${row.weekday}`}
                        defaultValue={row.end_time.slice(0, 5)}
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <>
                      <input type="hidden" name={`start_time_${row.weekday}`} value={row.start_time.slice(0, 5)} />
                      <input type="hidden" name={`end_time_${row.weekday}`} value={row.end_time.slice(0, 5)} />
                      <span className="text-sm text-muted-foreground">Kapalı</span>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {state.status === "error" ? <p className="text-sm text-destructive">{state.message}</p> : null}
          {state.status === "success" ? (
            <p className="text-sm text-primary">Müsaitlik kaydedildi.</p>
          ) : null}

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
