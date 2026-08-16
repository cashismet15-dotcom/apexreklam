"use client"

import { useState } from "react"
import { CalendarPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { YakamozJobFormDialog } from "@/components/yakamoz/yakamoz-job-form-dialog"

export function NewYakamozJobButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CalendarPlus />
        Randevu Ekle
      </Button>
      <YakamozJobFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
