"use client"

import { useActionState, useRef } from "react"
import { Camera } from "lucide-react"

import { Button } from "@/components/ui/button"
import { uploadAvatar } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"

export function AvatarUploadButton() {
  const [state, formAction, isPending] = useActionState(uploadAvatar, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/*"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Camera />
        {isPending ? "Yükleniyor..." : "Profil Resmi Değiştir"}
      </Button>
      {state.status === "error" ? <p className="text-xs text-destructive">{state.message}</p> : null}
    </form>
  )
}
