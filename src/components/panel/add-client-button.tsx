"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerFormDialog } from "@/components/panel/customer-form-dialog"

export function AddClientButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Müşteri Ekle
      </Button>
      <CustomerFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
