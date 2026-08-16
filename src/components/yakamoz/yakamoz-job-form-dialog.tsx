"use client"

import { useActionState, useEffect, useState } from "react"

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
import { createYakamozJob, updateYakamozJob } from "@/lib/actions/yakamoz-jobs"
import { initialActionState } from "@/lib/actions/shared"
import { YAKAMOZ_STATUS_LABELS, YAKAMOZ_STATUS_ORDER } from "@/lib/yakamoz"
import { ISTANBUL_ILCELERI, YAKAMOZ_IL, getMahalleSuggestions } from "@/lib/tr-locations"
import type { YakamozJob } from "@/lib/types"

interface YakamozJobFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: YakamozJob
}

export function YakamozJobFormDialog({ open, onOpenChange, job }: YakamozJobFormDialogProps) {
  const action = job ? updateYakamozJob.bind(null, job.id) : createYakamozJob
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const [ilce, setIlce] = useState(job?.ilce ?? "")
  const mahalleSuggestions = getMahalleSuggestions(ilce)

  useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? (job?.id ?? "new") : "closed"}>
        <DialogHeader>
          <DialogTitle>{job ? "Randevuyu Düzenle" : "Randevu Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer_name">Ad Soyad</Label>
              <Input id="customer_name" name="customer_name" defaultValue={job?.customer_name ?? ""} />
              <FieldError errors={state.fieldErrors?.customer_name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" defaultValue={job?.phone ?? ""} required />
              <FieldError errors={state.fieldErrors?.phone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="il">İl</Label>
              <Input id="il" name="il" defaultValue={job?.il ?? YAKAMOZ_IL} required />
              <FieldError errors={state.fieldErrors?.il} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ilce">İlçe</Label>
              <Select name="ilce" defaultValue={job?.ilce ?? undefined} onValueChange={setIlce}>
                <SelectTrigger id="ilce" className="w-full">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {ISTANBUL_ILCELERI.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.ilce} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mahalle">Mahalle</Label>
            <Input
              id="mahalle"
              name="mahalle"
              list="mahalle-suggestions"
              defaultValue={job?.mahalle ?? ""}
            />
            <datalist id="mahalle-suggestions">
              {mahalleSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <FieldError errors={state.fieldErrors?.mahalle} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address_text">Adres / Konum Notu</Label>
            <Textarea
              id="address_text"
              name="address_text"
              rows={2}
              defaultValue={job?.address_text ?? ""}
            />
            <FieldError errors={state.fieldErrors?.address_text} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lat">Enlem</Label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="any"
                defaultValue={job?.lat ?? ""}
              />
              <FieldError errors={state.fieldErrors?.lat} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lng">Boylam</Label>
              <Input
                id="lng"
                name="lng"
                type="number"
                step="any"
                defaultValue={job?.lng ?? ""}
              />
              <FieldError errors={state.fieldErrors?.lng} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="requested_date">Tarih</Label>
              <Input
                id="requested_date"
                name="requested_date"
                type="date"
                defaultValue={job?.requested_date ?? ""}
              />
              <FieldError errors={state.fieldErrors?.requested_date} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="requested_time">Saat</Label>
              <Input
                id="requested_time"
                name="requested_time"
                type="time"
                defaultValue={job?.requested_time?.slice(0, 5) ?? ""}
              />
              <FieldError errors={state.fieldErrors?.requested_time} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price_per_m2">Fiyat/m² (₺)</Label>
              <Input
                id="price_per_m2"
                name="price_per_m2"
                type="number"
                min={0}
                step="0.01"
                defaultValue={job?.price_per_m2 ?? ""}
              />
              <FieldError errors={state.fieldErrors?.price_per_m2} />
            </div>
          </div>

          {job ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Durum</Label>
              <Select name="status" defaultValue={job.status}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YAKAMOZ_STATUS_ORDER.map((key) => (
                    <SelectItem key={key} value={key}>
                      {YAKAMOZ_STATUS_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.status} />
            </div>
          ) : (
            <input type="hidden" name="status" value="siparis_alindi" />
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Not</Label>
            <Textarea id="note" name="note" rows={2} defaultValue={job?.note ?? ""} />
            <FieldError errors={state.fieldErrors?.note} />
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
