"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/actions/auth"
import { initialActionState } from "@/lib/actions/shared"

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(login, initialActionState)

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Kullanıcı Adı</Label>
        <Input id="username" name="username" autoFocus required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passcode">Şifre</Label>
        <Input id="passcode" name="passcode" type="password" required />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
    </form>
  )
}
