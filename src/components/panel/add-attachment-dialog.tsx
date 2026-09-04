"use client"

import { useActionState, useEffect, useRef } from "react"
import { Link2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { addTaskLink, uploadTaskAttachment } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"

interface AddAttachmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

export function AddAttachmentDialog({ open, onOpenChange, taskId }: AddAttachmentDialogProps) {
  const uploadAction = uploadTaskAttachment.bind(null, taskId)
  const [uploadState, uploadFormAction, isUploading] = useActionState(
    uploadAction,
    initialActionState
  )
  const uploadFormRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const linkAction = addTaskLink.bind(null, taskId)
  const [linkState, linkFormAction, isAddingLink] = useActionState(linkAction, initialActionState)
  const linkFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (uploadState.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadState])

  useEffect(() => {
    if (linkState.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkState])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ek Ekle</DialogTitle>
        </DialogHeader>

        <form ref={uploadFormRef} action={uploadFormAction} className="flex flex-col gap-1.5">
          <Label>PDF Sunum Yükle</Label>
          <p className="text-xs text-muted-foreground">Sadece PDF — 25MB&apos;a kadar.</p>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept="application/pdf"
            className="hidden"
            onChange={() => uploadFormRef.current?.requestSubmit()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 self-start"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
            {isUploading ? "Yükleniyor..." : "PDF Seç"}
          </Button>
          {uploadState.status === "error" ? (
            <p className="text-xs text-destructive">{uploadState.message}</p>
          ) : null}
        </form>

        <Separator />

        <form ref={linkFormRef} action={linkFormAction} className="flex flex-col gap-3">
          <div>
            <Label>Google Drive Video Linki Ekle</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Videoyu Drive&apos;a yükleyip paylaşım linkini buraya yapıştır.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Input name="label" placeholder="Etiket (opsiyonel) — örn. Eylül reklam videosu" />
            <FieldError errors={linkState.fieldErrors?.label} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Input name="url" placeholder="https://drive.google.com/..." required />
            <FieldError errors={linkState.fieldErrors?.url} />
          </div>
          {linkState.status === "error" && !linkState.fieldErrors ? (
            <p className="text-xs text-destructive">{linkState.message}</p>
          ) : null}
          <Button type="submit" size="sm" className="self-start" disabled={isAddingLink}>
            <Link2 />
            {isAddingLink ? "Ekleniyor..." : "Link Ekle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
