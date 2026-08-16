"use client"

import { useActionState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBalanceTopup } from "@/lib/actions/partner-wallet"
import { initialActionState, type ActionState } from "@/lib/actions/shared"

export function BalanceTopupForm() {
  const [state, formAction, isPending] = useActionState<ActionState & { paymentPageUrl?: string }, FormData>(
    createBalanceTopup,
    initialActionState
  )

  useEffect(() => {
    if (state.status === "success" && state.paymentPageUrl) {
      window.location.href = state.paymentPageUrl
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="amount">Yüklenecek Tutar (₺)</Label>
      <div className="flex gap-2">
        <Input id="amount" name="amount" type="number" min={100} step="1" placeholder="500" className="max-w-40" />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Yönlendiriliyor..." : "Bakiye Yükle"}
        </Button>
      </div>
      <FieldError errors={state.fieldErrors?.amount} />
      {state.status === "error" ? <p className="text-sm text-destructive">{state.message}</p> : null}
    </form>
  )
}
