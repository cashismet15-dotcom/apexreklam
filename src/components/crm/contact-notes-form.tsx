"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/shared/field-error"
import { Textarea } from "@/components/ui/textarea"
import { updateContactNotes } from "@/lib/actions/crm"
import { initialActionState } from "@/lib/actions/shared"

export function ContactNotesForm({
  contactId,
  initialNotes,
}: {
  contactId: string
  initialNotes: string | null
}) {
  const action = updateContactNotes.bind(null, contactId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Textarea
        name="notes"
        rows={6}
        placeholder="Bu kişiyle konuşmandan sonra buraya not al..."
        defaultValue={initialNotes ?? ""}
      />
      <FieldError errors={state.fieldErrors?.notes} />
      {state.status === "error" && !state.fieldErrors ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      {state.status === "success" ? <p className="text-xs text-emerald-600">Kaydedildi.</p> : null}
      <Button type="submit" size="sm" className="self-start" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Notu Kaydet"}
      </Button>
    </form>
  )
}
