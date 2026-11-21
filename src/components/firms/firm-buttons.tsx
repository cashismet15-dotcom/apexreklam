"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Building2, Pencil, Trash2 } from "lucide-react"

import { FirmFormDialog } from "@/components/firms/firm-form-dialog"
import { Button } from "@/components/ui/button"
import { deleteFirm } from "@/lib/actions/firms"
import type { Firm } from "@/lib/types"

export function AddFirmButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Building2 />
        Yeni Firma Ekle
      </Button>
      <FirmFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function EditFirmButton({ firm }: { firm: Firm }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        Düzenle
      </Button>
      <FirmFormDialog open={open} onOpenChange={setOpen} firm={firm} />
    </>
  )
}

export function DeleteFirmButton({ firmId, firmName }: { firmId: string; firmName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`"${firmName}" ve tüm notları silinsin mi? Muhasebe kaydı silinmez.`)) return
        startTransition(async () => {
          const result = await deleteFirm(firmId)
          if (result.status === "success") router.push("/panel/firmalar")
        })
      }}
    >
      <Trash2 />
      Sil
    </Button>
  )
}
