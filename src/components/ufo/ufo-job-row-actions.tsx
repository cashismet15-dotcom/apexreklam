"use client"

import { useState, useTransition } from "react"
import { ArrowRightCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UfoJobFormDialog } from "@/components/ufo/ufo-job-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { convertUfoAppointmentToJob, deleteUfoJob } from "@/lib/actions/ufo-jobs"
import { formatCurrency } from "@/lib/format"
import { ufoJobTypeLabel } from "@/lib/ufo"
import type { UfoJob } from "@/lib/types"

export function UfoJobRowActions({ job }: { job: UfoJob }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isConverting, startConvert] = useTransition()
  const [convertError, setConvertError] = useState<string | null>(null)

  function handleConvert() {
    setConvertError(null)
    startConvert(async () => {
      const result = await convertUfoAppointmentToJob(job.id)
      if (result.status === "error") setConvertError(result.message ?? "Bir hata oluştu.")
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">İşlemler</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {job.record_type === "randevu" ? (
            <DropdownMenuItem disabled={isConverting} onSelect={handleConvert}>
              <ArrowRightCircle />
              {isConverting ? "Çevriliyor..." : "İşe Çevir"}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {convertError ? <p className="text-xs text-destructive">{convertError}</p> : null}

      <UfoJobFormDialog open={editOpen} onOpenChange={setEditOpen} job={job} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={job.record_type === "randevu" ? "Randevuyu sil" : "İşi sil"}
        description={`${ufoJobTypeLabel(job)} · ${formatCurrency(job.amount)} tutarındaki kayıt silinecek. Bu işlem geri alınamaz.`}
        onConfirm={() => deleteUfoJob(job.id)}
      />
    </>
  )
}
