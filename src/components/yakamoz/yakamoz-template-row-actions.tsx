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
import { YakamozTemplateFormDialog } from "@/components/yakamoz/yakamoz-template-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteYakamozTemplate } from "@/lib/actions/yakamoz-broadcast"
import type { YakamozTemplate } from "@/lib/types"

export function YakamozTemplateRowActions({ template }: { template: YakamozTemplate }) {
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

      <YakamozTemplateFormDialog open={editOpen} onOpenChange={setEditOpen} template={template} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Şablonu sil"
        description={`"${template.title}" şablonu silinecek. Bu şablona bağlı özel günler varsa şablon bağlantıları kalkar.`}
        onConfirm={() => deleteYakamozTemplate(template.id)}
      />
    </>
  )
}
