"use client"

import { useActionState, useEffect, useRef } from "react"
import type { KeyboardEvent } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addPanelNote } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"

export function AddNoteForm({
  isPrivate,
  placeholder,
}: {
  isPrivate: boolean
  placeholder?: string
}) {
  const action = addPanelNote.bind(null, isPrivate)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
      textareaRef.current?.focus()
    }
  }, [state])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Textarea
        ref={textareaRef}
        name="body"
        placeholder={placeholder ?? "Bir not yaz... (Enter ile ekle, yeni satır için Shift+Enter)"}
        rows={2}
        required
        onKeyDown={handleKeyDown}
        className="resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        {state.status === "error" ? (
          <p className="text-xs text-destructive">{state.message}</p>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          <Send />
          {isPending ? "Ekleniyor..." : "Ekle"}
        </Button>
      </div>
    </form>
  )
}
