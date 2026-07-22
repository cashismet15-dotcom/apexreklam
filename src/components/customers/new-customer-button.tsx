"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"

export function NewCustomerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Yeni Müşteri
      </Button>
      <CustomerFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
