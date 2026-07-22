"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/shared/field-error"
import { Textarea } from "@/components/ui/textarea"
import { sendManualMessage } from "@/lib/actions/crm"
import { initialActionState } from "@/lib/actions/shared"

export function SendMessageForm({ contactId, phone }: { contactId: string; phone: string }) {
  const action = sendManualMessage.bind(null, contactId, phone)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Textarea name="body" rows={2} placeholder="Mesaj yaz..." required />
      <FieldError errors={state.fieldErrors?.body} />
      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <Button type="submit" size="sm" className="self-end" disabled={isPending}>
        {isPending ? "Gönderiliyor..." : "Gönder"}
      </Button>
    </form>
  )
}
