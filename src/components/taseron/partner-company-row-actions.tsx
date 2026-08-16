"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { KeyRound, MoreHorizontal, Power, Trash2, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DeleteAlertDialog } from "@/components/shared/delete-alert-dialog"
import {
  adjustPartnerBalance,
  deletePartnerCompany,
  resetPartnerCompanyPasscode,
  setPartnerCompanyActive,
} from "@/lib/actions/partner-companies"
import { initialActionState } from "@/lib/actions/shared"
import type { PartnerCompany } from "@/lib/types"

export function PartnerCompanyRowActions({ company }: { company: PartnerCompany }) {
  const [resetOpen, setResetOpen] = useState(false)
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isToggling, startToggle] = useTransition()
  const [toggleError, setToggleError] = useState<string | null>(null)

  const resetAction = resetPartnerCompanyPasscode.bind(null, company.id)
  const [resetState, resetFormAction, isResetting] = useActionState(resetAction, initialActionState)

  const balanceAction = adjustPartnerBalance.bind(null, company.id)
  const [balanceState, balanceFormAction, isAdjustingBalance] = useActionState(balanceAction, initialActionState)

  useEffect(() => {
    if (resetState.status === "success") setResetOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetState])

  useEffect(() => {
    if (balanceState.status === "success") setBalanceOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceState])

  function handleToggle() {
    setToggleError(null)
    startToggle(async () => {
      const result = await setPartnerCompanyActive(company.id, !company.active)
      if (result.status === "error") setToggleError(result.message ?? "Bir hata oluştu.")
    })
  }

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
          <DropdownMenuItem disabled={isToggling} onSelect={handleToggle}>
            <Power />
            {company.active ? "Pasif Yap" : "Aktif Yap"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRound />
            Şifre Sıfırla
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setBalanceOpen(true)}>
            <Wallet />
            Bakiye Düzelt
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {toggleError ? <p className="text-xs text-destructive">{toggleError}</p> : null}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent key={resetOpen ? "open" : "closed"}>
          <DialogHeader>
            <DialogTitle>{company.name} — Şifre Sıfırla</DialogTitle>
          </DialogHeader>
          <form action={resetFormAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="passcode">Yeni Şifre</Label>
              <Input id="passcode" name="passcode" type="text" required />
              <FieldError errors={resetState.fieldErrors?.passcode} />
            </div>

            {resetState.status === "error" && !resetState.fieldErrors ? (
              <p className="text-sm text-destructive">{resetState.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent key={balanceOpen ? "open" : "closed"}>
          <DialogHeader>
            <DialogTitle>{company.name} — Bakiye Düzelt</DialogTitle>
          </DialogHeader>
          <form action={balanceFormAction} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Güncel bakiye: <span className="font-medium text-foreground">{company.balance} ₺</span>
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Tutar (₺)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="Eklemek için pozitif, düşmek için negatif gir (örn. -100)" required />
              <FieldError errors={balanceState.fieldErrors?.amount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">Not</Label>
              <Input id="note" name="note" placeholder="Neden düzeltiyorsun?" required />
              <FieldError errors={balanceState.fieldErrors?.note} />
            </div>

            {balanceState.status === "error" && !balanceState.fieldErrors ? (
              <p className="text-sm text-destructive">{balanceState.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBalanceOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isAdjustingBalance}>
                {isAdjustingBalance ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Firmayı sil"
        description={`${company.name} silinecek ve giriş yapamaz olur. Geçmişte aldığı işlerdeki "kim aldı" bilgisi de temizlenir. Geçmişi korumak istiyorsan bunun yerine "Pasif Yap"ı kullan. Bu işlem geri alınamaz.`}
        onConfirm={() => deletePartnerCompany(company.id)}
      />
    </>
  )
}
