"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updatePartnerCompanyProfile } from "@/lib/actions/partner-companies"
import { initialActionState } from "@/lib/actions/shared"
import type { PartnerCompany } from "@/lib/types"

export function PartnerProfileForm({ company }: { company: PartnerCompany }) {
  const action = updatePartnerCompanyProfile.bind(null, company.id)
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tax_id">Vergi No</Label>
          <Input id="tax_id" name="tax_id" defaultValue={company.tax_id ?? ""} />
          <FieldError errors={state.fieldErrors?.tax_id} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tax_office">Vergi Dairesi</Label>
          <Input id="tax_office" name="tax_office" defaultValue={company.tax_office ?? ""} />
          <FieldError errors={state.fieldErrors?.tax_office} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Adres</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={company.address ?? ""} />
        <FieldError errors={state.fieldErrors?.address} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact_name">Yetkili Kişi</Label>
          <Input id="contact_name" name="contact_name" defaultValue={company.contact_name ?? ""} />
          <FieldError errors={state.fieldErrors?.contact_name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact_phone">Telefon</Label>
          <Input id="contact_phone" name="contact_phone" defaultValue={company.contact_phone ?? ""} />
          <FieldError errors={state.fieldErrors?.contact_phone} />
        </div>
      </div>

      {state.status === "error" && !state.fieldErrors ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}
