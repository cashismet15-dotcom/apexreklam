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
import { QuickReplyFormDialog } from "@/components/crm/quick-reply-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteQuickReply } from "@/lib/actions/crm"
import type { CrmQuickReply } from "@/lib/types"

export function QuickReplyRowActions({ quickReply }: { quickReply: CrmQuickReply }) {
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

      <QuickReplyFormDialog open={editOpen} onOpenChange={setEditOpen} quickReply={quickReply} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hazır yanıtı sil"
        description={`"${quickReply.title}" hazır yanıtı silinecek. Bu işlem geri alınamaz.`}
        onConfirm={() => deleteQuickReply(quickReply.id)}
      />
    </>
  )
}
