"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightCircle, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UfoJobFormDialog } from "@/components/ufo/ufo-job-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { convertUfoAppointmentToJob, deleteUfoJob } from "@/lib/actions/ufo-jobs"
import { formatCurrency } from "@/lib/format"
import { ufoJobTypeLabel } from "@/lib/ufo"
import type { UfoJob } from "@/lib/types"

export function UfoJobDetailActions({ job }: { job: UfoJob }) {
  const router = useRouter()
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
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {job.record_type === "randevu" ? (
          <Button variant="outline" size="sm" disabled={isConverting} onClick={handleConvert}>
            <ArrowRightCircle />
            {isConverting ? "Çevriliyor..." : "İşe Çevir"}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil />
          Düzenle
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 />
          Sil
        </Button>
      </div>

      {convertError ? <p className="text-xs text-destructive">{convertError}</p> : null}

      <UfoJobFormDialog open={editOpen} onOpenChange={setEditOpen} job={job} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={job.record_type === "randevu" ? "Randevuyu sil" : "İşi sil"}
        description={`${ufoJobTypeLabel(job)} · ${formatCurrency(job.amount)} tutarındaki kayıt silinecek. Bu işlem geri alınamaz.`}
        onConfirm={async () => {
          const result = await deleteUfoJob(job.id)
          if (result.status === "success") router.push("/ufo-temizlik")
          return result
        }}
      />
    </div>
  )
}
