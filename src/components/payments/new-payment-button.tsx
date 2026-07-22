"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog"
import type { Customer } from "@/lib/types"

export function NewPaymentButton({
  customers,
}: {
  customers: Pick<Customer, "id" | "company_name" | "contact_name" | "monthly_fee">[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={customers.length === 0}>
        <Plus />
        Ödeme Ekle
      </Button>
      <PaymentFormDialog open={open} onOpenChange={setOpen} customers={customers} />
    </>
  )
}
