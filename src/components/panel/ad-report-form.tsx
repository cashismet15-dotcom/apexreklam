"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertAdReport } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"
import { currentPeriodIso } from "@/lib/panel"

export function AdReportForm({ customerId }: { customerId: string }) {
  const action = upsertAdReport.bind(null, customerId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset()
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Rapor Ekle / Güncelle</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="period">Ay</Label>
              <Input
                id="period"
                name="period"
                type="month"
                defaultValue={currentPeriodIso().slice(0, 7)}
                required
              />
              <FieldError errors={state.fieldErrors?.period} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="spend">Harcama (₺, opsiyonel)</Label>
              <Input id="spend" name="spend" type="number" step="0.01" min="0" placeholder="örn. 5000" />
              <FieldError errors={state.fieldErrors?.spend} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Sonuç / Not</Label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              placeholder="örn. 42 mesaj, 1.2K tıklama — rapor linki: ..."
            />
            <FieldError errors={state.fieldErrors?.note} />
          </div>

          {state.status === "error" && !state.fieldErrors ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <Button type="submit" size="sm" className="self-end" disabled={isPending}>
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
