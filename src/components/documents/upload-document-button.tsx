"use client"

import { useActionState, useEffect, useRef } from "react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { uploadDocuments } from "@/lib/actions/documents"
import { initialActionState } from "@/lib/actions/shared"

export function UploadDocumentButton() {
  const [state, formAction, isPending] = useActionState(uploadDocuments, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.status !== "idle") formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-end gap-1.5">
      <input
        ref={inputRef}
        type="file"
        name="file"
        multiple
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {isPending ? "Yükleniyor..." : "Döküman Yükle"}
      </Button>
      {state.status === "error" ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  )
}
