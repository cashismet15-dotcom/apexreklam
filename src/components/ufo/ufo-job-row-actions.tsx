"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UfoJobFormDialog } from "@/components/ufo/ufo-job-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteUfoJob } from "@/lib/actions/ufo-jobs"
import { formatCurrency } from "@/lib/format"
import { ufoJobTypeLabel } from "@/lib/ufo"
import type { UfoJob } from "@/lib/types"

export function UfoJobRowActions({ job }: { job: UfoJob }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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

      <UfoJobFormDialog open={editOpen} onOpenChange={setEditOpen} job={job} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="İşi sil"
        description={`${ufoJobTypeLabel(job)} · ${formatCurrency(job.amount)} tutarındaki iş kaydı silinecek. Bu işlem geri alınamaz.`}
        onConfirm={() => deleteUfoJob(job.id)}
      />
    </>
  )
}
