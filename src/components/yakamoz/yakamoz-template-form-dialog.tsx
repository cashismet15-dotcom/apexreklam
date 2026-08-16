"use client"

import { useActionState, useEffect } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/shared/field-error"
import { createYakamozTemplate, updateYakamozTemplate } from "@/lib/actions/yakamoz-broadcast"
import { initialActionState } from "@/lib/actions/shared"
import type { YakamozTemplate } from "@/lib/types"

interface YakamozTemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: YakamozTemplate
}

export function YakamozTemplateFormDialog({
  open,
  onOpenChange,
  template,
}: YakamozTemplateFormDialogProps) {
  const action = template ? updateYakamozTemplate.bind(null, template.id) : createYakamozTemplate
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? (template?.id ?? "new") : "closed"}>
        <DialogHeader>
          <DialogTitle>{template ? "Şablonu Düzenle" : "Şablon Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" defaultValue={template?.title ?? ""} required />
            <FieldError errors={state.fieldErrors?.title} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Mesaj</Label>
            <Textarea
              id="body"
              name="body"
              rows={4}
              defaultValue={template?.body ?? ""}
              required
            />
            <span className="text-xs text-muted-foreground">
              Kişinin adını eklemek için metnin içine <code>{"{{ad}}"}</code> yazabilirsin.
            </span>
            <FieldError errors={state.fieldErrors?.body} />
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
