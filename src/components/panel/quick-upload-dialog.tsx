"use client"

import { useActionState, useEffect, useRef } from "react"
import { Upload } from "lucide-react"

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
import { uploadPresentation } from "@/lib/actions/documents"
import { initialActionState } from "@/lib/actions/shared"

interface QuickUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickUploadDialog({ open, onOpenChange }: QuickUploadDialogProps) {
  const [state, formAction, isPending] = useActionState(uploadPresentation, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sunum Yükle</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Sunum Adı</Label>
            <Input id="name" name="name" placeholder="örn. Yapay Zeka Hizmetlerimiz" required />
            <FieldError errors={state.fieldErrors?.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Not (opsiyonel)</Label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              placeholder="Bu sunum hakkında kısa bir not..."
            />
            <FieldError errors={state.fieldErrors?.note} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">PDF Dosyası</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" required />
            <p className="text-xs text-muted-foreground">Sadece PDF — 25MB&apos;a kadar.</p>
          </div>

          {state.status === "error" && !state.fieldErrors ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              <Upload />
              {isPending ? "Yükleniyor..." : "Yükle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
