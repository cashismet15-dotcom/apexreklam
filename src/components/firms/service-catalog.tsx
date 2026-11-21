"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { FieldError } from "@/components/shared/field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { createService, deleteService, setServiceActive, updateService } from "@/lib/actions/firms"
import { initialActionState } from "@/lib/actions/shared"
import { SERVICE_BILLING_LABEL } from "@/lib/firms"
import { formatCurrency } from "@/lib/format"
import type { Service } from "@/lib/types"

function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
}) {
  const action = service ? updateService.bind(null, service.id) : createService
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Hizmeti Düzenle" : "Yeni Hizmet"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-name">Hizmet Adı</Label>
            <Input id="svc-name" name="name" placeholder="Örn. Meta Reklam Yönetimi" defaultValue={service?.name} required />
            <FieldError errors={state.fieldErrors?.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-price">Fiyat (₺)</Label>
              <Input id="svc-price" name="price" type="number" min={0} step="0.01" defaultValue={service?.price} required />
              <FieldError errors={state.fieldErrors?.price} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-billing">Ödeme Tipi</Label>
              <Select name="billing" defaultValue={service?.billing ?? "aylik"}>
                <SelectTrigger id="svc-billing" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aylik">Aylık</SelectItem>
                  <SelectItem value="tek_seferlik">Tek Seferlik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-desc">Açıklama (opsiyonel)</Label>
            <Textarea id="svc-desc" name="description" rows={3} defaultValue={service?.description ?? ""} />
          </div>
          {state.status === "error" ? <p className="text-sm text-destructive">{state.message}</p> : null}
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

export function AddServiceButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Yeni Hizmet
      </Button>
      <ServiceFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function ServiceRow({ service }: { service: Service }) {
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${service.active ? "" : "text-muted-foreground line-through"}`}>
            {service.name}
          </span>
          <Badge variant="outline">{SERVICE_BILLING_LABEL[service.billing]}</Badge>
        </div>
        {service.description ? (
          <span className="text-xs text-muted-foreground">{service.description}</span>
        ) : null}
      </div>
      <span className="text-sm font-semibold">
        {formatCurrency(service.price)}
        {service.billing === "aylik" ? <span className="text-xs font-normal text-muted-foreground">/ay</span> : null}
      </span>
      <Switch
        checked={service.active}
        disabled={isPending}
        aria-label="Aktif"
        onCheckedChange={(v) => startTransition(async () => void (await setServiceActive(service.id, v)))}
      />
      <Button variant="ghost" size="icon-sm" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" />
        <span className="sr-only">Düzenle</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`"${service.name}" silinsin mi? Firmaların mevcut anlaşmaları etkilenmez.`)) return
          startTransition(async () => void (await deleteService(service.id)))
        }}
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Sil</span>
      </Button>
      <ServiceFormDialog open={editOpen} onOpenChange={setEditOpen} service={service} />
    </div>
  )
}

export function ServiceCatalog({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          Henüz hizmet eklenmedi — &quot;Yeni Hizmet&quot; ile başla.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {services.map((s) => (
          <ServiceRow key={s.id} service={s} />
        ))}
      </CardContent>
    </Card>
  )
}
