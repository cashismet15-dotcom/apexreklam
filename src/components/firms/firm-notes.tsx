"use client"

import { useActionState, useEffect, useRef, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addFirmNote, deleteFirmNote } from "@/lib/actions/firms"
import { initialActionState } from "@/lib/actions/shared"
import { TEAM_MEMBER_LABEL, formatMeetingDateTime } from "@/lib/panel"
import type { FirmNote } from "@/lib/types"

function NoteRow({ note }: { note: FirmNote }) {
  const [isPending, startTransition] = useTransition()
  return (
    <div className="group flex items-start gap-3 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {TEAM_MEMBER_LABEL[note.author]} · {formatMeetingDateTime(note.created_at)}
        </span>
        <p className="whitespace-pre-wrap text-sm">{note.body}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        disabled={isPending}
        onClick={() => startTransition(async () => void (await deleteFirmNote(note.id)))}
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Notu sil</span>
      </Button>
    </div>
  )
}

export function FirmNotes({ firmId, notes }: { firmId: string; notes: FirmNote[] }) {
  const [state, formAction, isPending] = useActionState(
    addFirmNote.bind(null, firmId),
    initialActionState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset()
  }, [state])

  return (
    <div className="flex flex-col gap-2">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <Textarea name="body" rows={3} placeholder="Firma hakkında yeni bir not yaz..." required />
        <div className="flex items-center justify-between gap-2">
          {state.status === "error" ? (
            <p className="text-xs text-destructive">{state.message}</p>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Ekleniyor..." : "Not Ekle"}
          </Button>
        </div>
      </form>
      {notes.length > 0 ? (
        <div className="flex flex-col divide-y">
          {notes.map((n) => (
            <NoteRow key={n.id} note={n} />
          ))}
        </div>
      ) : (
        <p className="py-2 text-sm text-muted-foreground">Henüz not yok.</p>
      )}
    </div>
  )
}
