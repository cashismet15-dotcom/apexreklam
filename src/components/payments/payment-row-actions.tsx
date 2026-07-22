"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deletePayment } from "@/lib/actions/payments"
import { formatCurrency } from "@/lib/format"
import type { Customer, PaymentWithCustomer } from "@/lib/types"

export function PaymentRowActions({
  payment,
  customers,
}: {
  payment: PaymentWithCustomer
  customers: Pick<Customer, "id" | "company_name" | "contact_name" | "monthly_fee">[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">İşlemler</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PaymentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customers={customers}
        payment={payment}
      />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Ödemeyi sil"
        description={`${payment.customer.company_name} için ${formatCurrency(payment.amount)} tutarındaki ödeme silinecek. Bu işlem geri alınamaz.`}
        onConfirm={() => deletePayment(payment.id)}
      />
    </>
  )
}
