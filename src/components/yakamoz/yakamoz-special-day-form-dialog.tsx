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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldError } from "@/components/shared/field-error"
import {
  createYakamozSpecialDay,
  updateYakamozSpecialDay,
} from "@/lib/actions/yakamoz-broadcast"
import { initialActionState } from "@/lib/actions/shared"
import { AY_ADLARI } from "@/lib/format"
import type { YakamozSpecialDay, YakamozTemplate } from "@/lib/types"

interface YakamozSpecialDayFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: YakamozTemplate[]
  specialDay?: YakamozSpecialDay
}

export function YakamozSpecialDayFormDialog({
  open,
  onOpenChange,
  templates,
  specialDay,
}: YakamozSpecialDayFormDialogProps) {
  const action = specialDay
    ? updateYakamozSpecialDay.bind(null, specialDay.id)
    : createYakamozSpecialDay
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? (specialDay?.id ?? "new") : "closed"}>
        <DialogHeader>
          <DialogTitle>{specialDay ? "Özel Günü Düzenle" : "Özel Gün Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" defaultValue={specialDay?.title ?? ""} required />
            <FieldError errors={state.fieldErrors?.title} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="month">Ay</Label>
              <Select name="month" defaultValue={specialDay ? String(specialDay.month) : undefined}>
                <SelectTrigger id="month" className="w-full">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {AY_ADLARI.map((name, i) => (
                    <SelectItem key={name} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.month} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="day">Gün</Label>
              <Input
                id="day"
                name="day"
                type="number"
                min={1}
                max={31}
                defaultValue={specialDay?.day ?? ""}
                required
              />
              <FieldError errors={state.fieldErrors?.day} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template_id">Şablon (opsiyonel)</Label>
            <Select name="template_id" defaultValue={specialDay?.template_id ?? undefined}>
              <SelectTrigger id="template_id" className="w-full">
                <SelectValue placeholder="Şablon seç" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state.fieldErrors?.template_id} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Ya da kendi metnini yaz</Label>
            <Textarea
              id="body"
              name="body"
              rows={3}
              defaultValue={specialDay?.body ?? ""}
              placeholder="Boş bırakırsan yukarıdaki şablon kullanılır"
            />
            <span className="text-xs text-muted-foreground">
              Burası doluysa şablon yerine bu metin kullanılır. <code>{"{{ad}}"}</code> destekler.
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
