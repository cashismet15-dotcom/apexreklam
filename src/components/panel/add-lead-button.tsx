"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LeadFormDialog } from "@/components/panel/lead-form-dialog"

export function AddLeadButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus />
        Potansiyel Müşteri Ekle
      </Button>
      <LeadFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
