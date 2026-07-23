"use client"

import { useActionState, useRef } from "react"
import { Upload } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { uploadClientLogo } from "@/lib/actions/content"
import { initialActionState } from "@/lib/actions/shared"
import { initials } from "@/lib/format"

export function LogoUpload({
  customerId,
  companyName,
  logoUrl,
}: {
  customerId: string
  companyName: string
  logoUrl: string | null
}) {
  const action = uploadClientLogo.bind(null, customerId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-16">
        <AvatarImage src={logoUrl ?? undefined} alt={companyName} />
        <AvatarFallback className="text-base">{initials(companyName)}</AvatarFallback>
      </Avatar>
      <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {isPending ? "Yükleniyor..." : logoUrl ? "Logoyu Değiştir" : "Logo Yükle"}
        </Button>
        {state.status === "error" ? (
          <p className="text-xs text-destructive">{state.message}</p>
        ) : null}
      </form>
    </div>
  )
}
