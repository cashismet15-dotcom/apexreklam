"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerFormDialog } from "@/components/panel/customer-form-dialog"
import type { Customer } from "@/lib/types"

export function EditClientButton({
  customer,
}: {
  customer: Pick<Customer, "id" | "company_name" | "contact_name" | "phone" | "notes">
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        Düzenle
      </Button>
      <CustomerFormDialog open={open} onOpenChange={setOpen} customer={customer} />
    </>
  )
}
