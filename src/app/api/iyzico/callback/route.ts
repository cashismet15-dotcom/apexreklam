import { NextRequest, NextResponse } from "next/server"

import { retrieveCheckout } from "@/lib/iyzico"
import { supabase } from "@/lib/supabase"

/**
 * iyzico Checkout Form V2 callback'i — ödeme tamamlandığında (başarılı ya da başarısız)
 * kullanıcının tarayıcısı buraya POST ile geri döner (`token` form alanıyla).
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get("token")

  if (typeof token !== "string" || !token) {
    return NextResponse.redirect(new URL("/taseron/profil?topup=failed", request.url))
  }

  const result = await retrieveCheckout(token)

  if (result.status !== "success") {
    await supabase.from("partner_transactions").update({ status: "failed" }).eq("iyzico_token", token)
    return NextResponse.redirect(new URL("/taseron/profil?topup=failed", request.url))
  }

  const { data: transaction } = await supabase
    .from("partner_transactions")
    .select("id")
    .eq("iyzico_token", token)
    .eq("status", "pending")
    .maybeSingle()

  if (!transaction) {
    return NextResponse.redirect(new URL("/taseron/profil?topup=failed", request.url))
  }

  await supabase
    .from("partner_transactions")
    .update({ iyzico_payment_id: result.paymentId ?? null })
    .eq("id", transaction.id)

  const { data: completion } = await supabase
    .rpc("complete_partner_topup", { p_transaction_id: transaction.id })
    .single<{ ok: boolean; company_id: string | null; amount: number | null }>()

  if (!completion?.ok) {
    return NextResponse.redirect(new URL("/taseron/profil?topup=failed", request.url))
  }

  return NextResponse.redirect(new URL("/taseron/profil?topup=success", request.url))
}
