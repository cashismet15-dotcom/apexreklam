"use client"

import { useActionState, useEffect, useRef } from "react"
import { Link2 } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { quickAddVideoLink } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"

interface QuickLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: { id: string; company_name: string }[]
}

export function QuickLinkDialog({ open, onOpenChange, customers }: QuickLinkDialogProps) {
  const [state, formAction, isPending] = useActionState(quickAddVideoLink, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Video Linki Ekle</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer_id_link">Şirket</Label>
            <Select name="customer_id">
              <SelectTrigger id="customer_id_link" className="w-full">
                <SelectValue placeholder="Şirket seç" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state.fieldErrors?.customer_id} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title_link">Başlık</Label>
            <Input id="title_link" name="title" placeholder="örn. Eylül reklam videosu" required />
            <FieldError errors={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url_link">Google Drive Linki</Label>
            <Input
              id="url_link"
              name="url"
              placeholder="https://drive.google.com/..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Paylaşım ayarını &quot;Bağlantıya sahip olan herkes&quot; yaptığından emin ol.
            </p>
            <FieldError errors={state.fieldErrors?.url} />
          </div>

          {state.status === "error" && !state.fieldErrors ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              <Link2 />
              {isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
