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
import { YakamozSpecialDayFormDialog } from "@/components/yakamoz/yakamoz-special-day-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteYakamozSpecialDay } from "@/lib/actions/yakamoz-broadcast"
import type { YakamozSpecialDay, YakamozTemplate } from "@/lib/types"

export function YakamozSpecialDayRowActions({
  specialDay,
  templates,
}: {
  specialDay: YakamozSpecialDay
  templates: YakamozTemplate[]
}) {
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

      <YakamozSpecialDayFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        templates={templates}
        specialDay={specialDay}
      />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Özel günü sil"
        description={`"${specialDay.title}" takvimden kaldırılacak.`}
        onConfirm={() => deleteYakamozSpecialDay(specialDay.id)}
      />
    </>
  )
}
