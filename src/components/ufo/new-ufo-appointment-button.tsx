"use client"

import { useState } from "react"
import { CalendarPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UfoJobFormDialog } from "@/components/ufo/ufo-job-form-dialog"

export function NewUfoAppointmentButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CalendarPlus />
        Randevu Ekle
      </Button>
      <UfoJobFormDialog open={open} onOpenChange={setOpen} defaultRecordType="randevu" />
    </>
  )
}
