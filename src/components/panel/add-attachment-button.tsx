"use client"

import { useState } from "react"
import { Paperclip } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AddAttachmentDialog } from "@/components/panel/add-attachment-dialog"

export function AddAttachmentButton({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Paperclip className="size-3.5" />
        Ek Ekle
      </Button>
      <AddAttachmentDialog open={open} onOpenChange={setOpen} taskId={taskId} />
    </>
  )
}
