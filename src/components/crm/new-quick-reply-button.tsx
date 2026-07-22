"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuickReplyFormDialog } from "@/components/crm/quick-reply-form-dialog"

export function NewQuickReplyButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Hazır Yanıt Ekle
      </Button>
      <QuickReplyFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
