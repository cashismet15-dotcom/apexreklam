"use client"

import { useState, useTransition } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { sendYakamozSpecialDayNow } from "@/lib/actions/yakamoz-broadcast"

export function YakamozSpecialDaySendButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleConfirm() {
    startTransition(async () => {
      const res = await sendYakamozSpecialDayNow(id)
      setResult(res.message ?? null)
      if (res.status === "success") setOpen(false)
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Send />
        Şimdi Gönder
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>&quot;{title}&quot; mesajını herkese gönder</AlertDialogTitle>
            <AlertDialogDescription>
              Kayıtlı tüm kişilere WhatsApp mesajı gönderilecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                handleConfirm()
              }}
            >
              {isPending ? "Gönderiliyor..." : "Gönder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
