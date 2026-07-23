"use client"

import { useState } from "react"
import { MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import { deleteCustomer, freezeCustomer, unfreezeCustomer } from "@/lib/actions/customers"
import type { Customer } from "@/lib/types"

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)

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
          {customer.status === "aktif" ? (
            <DropdownMenuItem onSelect={() => setFreezeOpen(true)}>
              <Pause />
              Dondur
            </DropdownMenuItem>
          ) : null}
          {customer.status === "donduruldu" ? (
            <DropdownMenuItem onSelect={() => setResumeOpen(true)}>
              <Play />
              Devam Ettir
            </DropdownMenuItem>
          ) : null}
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

      <ConfirmActionDialog
        open={freezeOpen}
        onOpenChange={setFreezeOpen}
        title="Müşteriyi dondur"
        description={`"${customer.company_name}" donduruluyor. Dondurulduğu sürece ödeme takibinde görünmez, gecikmiş sayılmaz. "Devam Ettir" dediğinizde geçen gün sayısı kadar ödeme tarihi otomatik ileri kayar — hiçbir gün kaybolmaz.`}
        confirmLabel="Dondur"
        pendingLabel="Donduruluyor..."
        onConfirm={() => freezeCustomer(customer.id)}
      />

      <ConfirmActionDialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        title="Müşteriyi devam ettir"
        description={`"${customer.company_name}" tekrar aktif edilecek. Dondurulduğu tarihten bugüne geçen gün sayısı, ödeme tarihine otomatik eklenecek.`}
        confirmLabel="Devam Ettir"
        pendingLabel="Devam ettiriliyor..."
        onConfirm={() => unfreezeCustomer(customer.id)}
      />
    </>
  )
}
