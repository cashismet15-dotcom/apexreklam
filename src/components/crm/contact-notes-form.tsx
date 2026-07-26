"use client"

import { useActionState, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/shared/field-error"
import { Textarea } from "@/components/ui/textarea"
import { addContactNote } from "@/lib/actions/crm"
import { initialActionState } from "@/lib/actions/shared"
import { formatDate } from "@/lib/format"
import type { CrmContactNote } from "@/lib/types"

export function ContactNotesForm({
  contactId,
  notes,
}: {
  contactId: string
  notes: CrmContactNote[]
}) {
  const action = addContactNote.bind(null, contactId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state.status === "success") {
      setFormKey((k) => k + 1)
    }
  }, [state])

  return (
    <div className="flex flex-col gap-4">
      <form key={formKey} action={formAction} className="flex flex-col gap-2">
        <Textarea
          name="body"
          rows={3}
          placeholder="Bu görüşmeden sonra buraya not al..."
          required
        />
        <FieldError errors={state.fieldErrors?.body} />
        {state.status === "error" && !state.fieldErrors ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}
        <Button type="submit" size="sm" className="self-start" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Not Ekle"}
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz not yok.</p>
      ) : (
        <div className="flex flex-col gap-3 border-t pt-4">
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {formatDate(note.created_at)}
              </span>
              <p className="text-sm whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
