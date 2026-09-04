"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteDocument } from "@/lib/actions/documents"
import type { DocumentFile } from "@/lib/types"

export function DocumentRowActions({ doc }: { doc: DocumentFile }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)}>
        <Trash2 />
        <span className="sr-only">Sil</span>
      </Button>

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Dökümanı sil"
        description={`"${doc.name}" kalıcı olarak silinecek.`}
        onConfirm={() => deleteDocument(doc.id, doc.file_path)}
      />
    </>
  )
}
