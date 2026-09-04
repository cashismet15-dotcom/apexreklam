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
import { PersonFormDialog } from "@/components/daily-tasks/person-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { removePerson } from "@/lib/actions/daily-tasks"
import type { DailyTaskPerson } from "@/lib/types"

export function PersonRowActions({ person }: { person: DailyTaskPerson }) {
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
            Adını Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Kişiyi Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PersonFormDialog open={editOpen} onOpenChange={setEditOpen} person={person} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Kişiyi sil"
        description={`"${person.name}" ve tüm görev geçmişi silinecek. Bu işlem geri alınamaz.`}
        onConfirm={() => removePerson(person.id)}
      />
    </>
  )
}
