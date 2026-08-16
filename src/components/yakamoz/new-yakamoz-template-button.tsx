"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { YakamozTemplateFormDialog } from "@/components/yakamoz/yakamoz-template-form-dialog"

export function NewYakamozTemplateButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Şablon Ekle
      </Button>
      <YakamozTemplateFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
