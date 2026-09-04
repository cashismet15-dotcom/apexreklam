"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PersonFormDialog } from "@/components/daily-tasks/person-form-dialog"

export function AddPersonButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus />
        Kişi Ekle
      </Button>
      <PersonFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
