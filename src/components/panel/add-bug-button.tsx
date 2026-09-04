"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BugFormDialog } from "@/components/panel/bug-form-dialog"

export function AddBugButton({
  customers,
}: {
  customers: { id: string; company_name: string }[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Hata Ekle
      </Button>
      <BugFormDialog open={open} onOpenChange={setOpen} customers={customers} />
    </>
  )
}
