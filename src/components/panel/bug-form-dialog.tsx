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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAiBug } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"
import { BUG_SEVERITIES, BUG_SEVERITY_LABEL } from "@/lib/panel"

interface BugFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: { id: string; company_name: string }[]
}

const GENEL_VALUE = "genel"

export function BugFormDialog({ open, onOpenChange, customers }: BugFormDialogProps) {
  const [state, formAction, isPending] = useActionState(createAiBug, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hata Ekle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" placeholder="örn. Chatbot yanlış fiyat söylüyor" required />
            <FieldError errors={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Not / Detay</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Ne fark ettin, nasıl tekrarlanıyor..."
            />
            <FieldError errors={state.fieldErrors?.description} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer_id">Müşteri (opsiyonel)</Label>
              <Select name="customer_id" defaultValue={GENEL_VALUE}>
                <SelectTrigger id="customer_id" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENEL_VALUE}>Genel / şirkete bağlı değil</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="severity">Önem Derecesi</Label>
              <Select name="severity" defaultValue="orta">
                <SelectTrigger id="severity" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUG_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BUG_SEVERITY_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image">Görsel (opsiyonel)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">Ekran görüntüsü — 25MB&apos;a kadar.</p>
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
