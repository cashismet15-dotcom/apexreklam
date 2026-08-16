"use server"

import { z } from "zod"

import { getSessionRole } from "@/lib/auth-role"
import { createTopupCheckout } from "@/lib/iyzico"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

const topupSchema = z.object({
  amount: z.coerce.number().min(100, "En az 100 TL yükleyebilirsiniz").max(50000, "En fazla 50.000 TL yükleyebilirsiniz"),
})

/** Sandbox'ta gerçek T.C. kimlik doğrulaması geçmesi için iyzico'nun bilinen test değeri. */
const FALLBACK_IDENTITY_NUMBER = "11111111111"

export async function createBalanceTopup(
  _prevState: ActionState & { paymentPageUrl?: string },
  formData: FormData
): Promise<ActionState & { paymentPageUrl?: string }> {
  const session = await getSessionRole()
  if (!session || session.role !== "partner" || !session.companyId) {
    return { status: "error", message: "Bu işlem için taşeron firma girişi gerekli." }
  }

  const parsed = topupSchema.safeParse({ amount: formData.get("amount") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: company, error: companyError } = await supabase
    .from("partner_companies")
    .select("id, name, contact_name, contact_phone, address, tax_id")
    .eq("id", session.companyId)
    .single()

  if (companyError || !company) {
    return { status: "error", message: "Firma bilgisi alınamadı." }
  }
  if (!company.contact_name || !company.contact_phone || !company.address) {
    return {
      status: "error",
      message: "Bakiye yüklemeden önce profilindeki yetkili kişi, telefon ve adres bilgilerini tamamla.",
    }
  }

  const { data: transaction, error: insertError } = await supabase
    .from("partner_transactions")
    .insert({
      company_id: session.companyId,
      type: "topup",
      amount: parsed.data.amount,
      status: "pending",
      note: "Bakiye yükleme (iyzico)",
    })
    .select("id")
    .single()

  if (insertError || !transaction) {
    return { status: "error", message: `İşlem oluşturulamadı: ${insertError?.message ?? ""}` }
  }

  const [name, ...surnameParts] = company.contact_name.trim().split(/\s+/)
  const surname = surnameParts.join(" ") || name

  const checkout = await createTopupCheckout({
    conversationId: transaction.id,
    amount: parsed.data.amount,
    buyer: {
      id: session.companyId,
      name,
      surname,
      identityNumber: /^\d{11}$/.test(company.tax_id ?? "") ? company.tax_id! : FALLBACK_IDENTITY_NUMBER,
      email: `${company.id}@taseron.apexreklam.local`,
      gsmNumber: company.contact_phone,
      address: company.address,
      city: "İstanbul",
      ip: "85.34.78.112",
    },
  })

  if (!checkout.ok) {
    await supabase.from("partner_transactions").update({ status: "failed" }).eq("id", transaction.id)
    return { status: "error", message: checkout.error }
  }

  await supabase
    .from("partner_transactions")
    .update({ iyzico_token: checkout.token })
    .eq("id", transaction.id)

  return { status: "success", message: "Yönlendiriliyor...", paymentPageUrl: checkout.paymentPageUrl }
}
