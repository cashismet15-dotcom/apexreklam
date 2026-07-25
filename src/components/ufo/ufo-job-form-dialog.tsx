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
import { createUfoJob, updateUfoJob } from "@/lib/actions/ufo-jobs"
import { initialActionState } from "@/lib/actions/shared"
import {
  UFO_CATEGORY_LABELS,
  UFO_CLEANING_TYPE_LABELS,
  UFO_HOME_TYPES,
  UFO_STATUS_LABELS,
} from "@/lib/ufo"
import type { UfoJob, UfoJobCategory, UfoRecordType } from "@/lib/types"

interface UfoJobFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: UfoJob
  /** Yeni kayıt oluştururken kullanılır; düzenlemede job.record_type esas alınır. */
  defaultRecordType?: UfoRecordType
}

export function UfoJobFormDialog({
  open,
  onOpenChange,
  job,
  defaultRecordType = "is",
}: UfoJobFormDialogProps) {
  const now = new Date()
  const action = job ? updateUfoJob.bind(null, job.id) : createUfoJob
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const [category, setCategory] = useState<UfoJobCategory>(job?.category ?? "ev_temizligi")
  const recordType = job?.record_type ?? defaultRecordType
  const isAppointment = recordType === "randevu"

  useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const isEvTemizligi = category === "ev_temizligi"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? (job?.id ?? "new") : "closed"}>
        <DialogHeader>
          <DialogTitle>
            {job
              ? isAppointment
                ? "Randevuyu Düzenle"
                : "İşi Düzenle"
              : isAppointment
                ? "Randevu Ekle"
                : "İş Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="record_type" value={recordType} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Kategori</Label>
            <Select
              name="category"
              defaultValue={job?.category ?? "ev_temizligi"}
              onValueChange={(v) => setCategory(v as UfoJobCategory)}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(UFO_CATEGORY_LABELS) as UfoJobCategory[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {UFO_CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state.fieldErrors?.category} />
          </div>

          {isEvTemizligi ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cleaning_type">Hizmet Tipi</Label>
                <Select name="cleaning_type" defaultValue={job?.cleaning_type ?? undefined}>
                  <SelectTrigger id="cleaning_type" className="w-full">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UFO_CLEANING_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={state.fieldErrors?.cleaning_type} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="home_type">Ev Tipi</Label>
                <Select name="home_type" defaultValue={job?.home_type ?? undefined}>
                  <SelectTrigger id="home_type" className="w-full">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFO_HOME_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={state.fieldErrors?.home_type} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Konum</Label>
            <Input id="location" name="location" defaultValue={job?.location ?? ""} />
            <FieldError errors={state.fieldErrors?.location} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer_name">Müşteri Adı</Label>
              <Input
                id="customer_name"
                name="customer_name"
                defaultValue={job?.customer_name ?? ""}
              />
              <FieldError errors={state.fieldErrors?.customer_name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customer_phone">Telefon</Label>
              <Input
                id="customer_phone"
                name="customer_phone"
                defaultValue={job?.customer_phone ?? ""}
              />
              <FieldError errors={state.fieldErrors?.customer_phone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Tutar (₺)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={job ? String(job.amount) : ""}
                required
              />
              <FieldError errors={state.fieldErrors?.amount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commission_amount">Komisyon Tutarı (₺)</Label>
              <Input
                id="commission_amount"
                name="commission_amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={job ? String(job.commission_amount) : ""}
              />
              <FieldError errors={state.fieldErrors?.commission_amount} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job_date">Tarih</Label>
              <Input
                id="job_date"
                name="job_date"
                type="date"
                defaultValue={job?.job_date ?? now.toISOString().slice(0, 10)}
                required
              />
              <FieldError errors={state.fieldErrors?.job_date} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job_time">Saat</Label>
              <Input
                id="job_time"
                name="job_time"
                type="time"
                defaultValue={job?.job_time?.slice(0, 5) ?? ""}
              />
              <FieldError errors={state.fieldErrors?.job_time} />
            </div>
          </div>

          {isAppointment ? null : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Durum</Label>
              <Select name="status" defaultValue={job?.status ?? "bekliyor"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UFO_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.status} />
            </div>
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
