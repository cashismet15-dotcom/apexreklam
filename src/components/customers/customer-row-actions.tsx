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
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteCustomer } from "@/lib/actions/customers"
import type { Customer } from "@/lib/types"

export function CustomerRowActions({ customer }: { customer: Customer }) {
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

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Müşteriyi sil"
        description={`"${customer.company_name}" silinecek. Bu müşteriye ait tüm ödeme kayıtları da birlikte silinir. Bu işlem geri alınamaz.`}
        onConfirm={() => deleteCustomer(customer.id)}
      />
    </>
  )
}
