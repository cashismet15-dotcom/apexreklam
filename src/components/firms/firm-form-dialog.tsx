"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { FieldError } from "@/components/shared/field-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createFirm, updateFirm } from "@/lib/actions/firms"
import { initialActionState } from "@/lib/actions/shared"
import type { Firm } from "@/lib/types"

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  errors,
  required,
  className,
}: {
  name: string
  label: string
  placeholder?: string
  defaultValue?: string | null
  errors?: string[]
  required?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={`firm-${name}`}>{label}</Label>
      <Input
        id={`firm-${name}`}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
      <FieldError errors={errors} />
    </div>
  )
}

export function FirmFormDialog({
  open,
  onOpenChange,
  firm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  firm?: Firm
}) {
  const router = useRouter()
  const action = firm ? updateFirm.bind(null, firm.id) : createFirm
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status !== "success") return
    onOpenChange(false)
    // Yeni firma: createFirm mesaj olarak yeni id'yi döner — direkt firmanın sayfasına git.
    if (!firm && state.message) router.push(`/panel/firmalar/${state.message}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const e = state.fieldErrors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{firm ? "Firmayı Düzenle" : "Yeni Firma Ekle"}</DialogTitle>
          <DialogDescription>
            Sadece firma adı zorunlu — diğerlerini sonra da doldurabilirsin.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field name="name" label="Firma Adı" defaultValue={firm?.name} errors={e?.name} required className="sm:col-span-2" />
            <Field name="contact_name" label="Yetkili Kişi" defaultValue={firm?.contact_name} errors={e?.contact_name} />
            <Field name="phone" label="Telefon" placeholder="05xx xxx xx xx" defaultValue={firm?.phone} errors={e?.phone} />
            <Field name="city" label="Şehir" placeholder="İstanbul" defaultValue={firm?.city} errors={e?.city} />
            <Field name="website" label="Web Sitesi" placeholder="ornekmuhendislik.com" defaultValue={firm?.website} errors={e?.website} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firm-firm_services">Firmanın Hizmetleri</Label>
            <Textarea
              id="firm-firm_services"
              name="firm_services"
              rows={2}
              placeholder="Örn. statik proje, zemin etüdü, yapı denetim..."
              defaultValue={firm?.firm_services ?? ""}
            />
            <FieldError errors={e?.firm_services} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Sosyal Medya (varsa)</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field name="instagram" label="Instagram" placeholder="@kullanici" defaultValue={firm?.instagram} errors={e?.instagram} />
              <Field name="linkedin" label="LinkedIn" placeholder="linkedin.com/company/..." defaultValue={firm?.linkedin} errors={e?.linkedin} />
              <Field name="facebook" label="Facebook" placeholder="facebook.com/..." defaultValue={firm?.facebook} errors={e?.facebook} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firm-about">Hakkında / İlk Tanışma Görüşmesi</Label>
            <Textarea
              id="firm-about"
              name="about"
              rows={5}
              placeholder="İlk görüşmede neler konuşuldu, firmanın ihtiyacı ne, kiminle görüşüldü..."
              defaultValue={firm?.about ?? ""}
            />
            <FieldError errors={e?.about} />
          </div>

          {state.status === "error" ? (
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
