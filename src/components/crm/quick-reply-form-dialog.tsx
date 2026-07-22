"use client"

import { useActionState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createQuickReply, updateQuickReply } from "@/lib/actions/crm"
import { initialActionState } from "@/lib/actions/shared"
import type { CrmQuickReply } from "@/lib/types"

interface QuickReplyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quickReply?: CrmQuickReply
}

export function QuickReplyFormDialog({
  open,
  onOpenChange,
  quickReply,
}: QuickReplyFormDialogProps) {
  const action = quickReply ? updateQuickReply.bind(null, quickReply.id) : createQuickReply
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{quickReply ? "Hazır Yanıtı Düzenle" : "Hazır Yanıt Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Buton Başlığı</Label>
            <Input
              id="title"
              name="title"
              placeholder="örn. Web Sitemiz"
              defaultValue={quickReply?.title}
              required
            />
            <FieldError errors={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Gönderilecek Mesaj</Label>
            <Textarea
              id="message"
              name="message"
              rows={3}
              defaultValue={quickReply?.message}
              required
            />
            <FieldError errors={state.fieldErrors?.message} />
          </div>

          {state.status === "error" && !state.fieldErrors ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
