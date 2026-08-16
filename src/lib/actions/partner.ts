"use server"

import { revalidatePath } from "next/cache"

import { getSessionRole } from "@/lib/auth-role"
import { PARTNER_TERMS_VERSION } from "@/lib/partner-terms"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

interface TakePartnerJobResult {
  ok: boolean
  message: string
}

export async function takePartnerJob(jobId: string): Promise<ActionState> {
  const session = await getSessionRole()
  if (!session || session.role !== "partner" || !session.companyId) {
    return { status: "error", message: "Bu işlem için taşeron firma girişi gerekli." }
  }

  const { data, error } = await supabase
    .rpc("take_partner_job", {
      p_job_id: jobId,
      p_company_id: session.companyId,
      p_terms_version: PARTNER_TERMS_VERSION,
    })
    .single<TakePartnerJobResult>()

  if (error) {
    return { status: "error", message: `İş alınamadı: ${error.message}` }
  }
  if (!data.ok) {
    return { status: "error", message: data.message }
  }

  revalidatePath("/taseron")
  revalidatePath("/taseron/profil")
  return { status: "success", message: data.message }
}
