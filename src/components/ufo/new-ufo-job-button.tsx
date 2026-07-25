"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UfoJobFormDialog } from "@/components/ufo/ufo-job-form-dialog"

export function NewUfoJobButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        İş Ekle
      </Button>
      <UfoJobFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
