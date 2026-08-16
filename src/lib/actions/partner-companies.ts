"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getSessionRole } from "@/lib/auth-role"
import { hashPasscode } from "@/lib/partner-auth"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

async function requireOwnerOrUfo(): Promise<ActionState | null> {
  const session = await getSessionRole()
  if (!session || (session.role !== "owner" && session.role !== "ufo")) {
    return { status: "error", message: "Bu işlem için yetkiniz yok." }
  }
  return null
}

async function requireOwnPartnerCompany(companyId: string): Promise<ActionState | null> {
  const session = await getSessionRole()
  if (!session || session.role !== "partner" || session.companyId !== companyId) {
    return { status: "error", message: "Bu işlem için yetkiniz yok." }
  }
  return null
}

function revalidatePartnerPages() {
  revalidatePath("/ufo-temizlik/taseron-firmalar")
  revalidatePath("/taseron/profil")
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Firma adı zorunlu").max(200),
  username: z
    .string()
    .trim()
    .min(3, "En az 3 karakter")
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Sadece harf, rakam, . _ - kullanılabilir"),
  passcode: z.string().min(6, "En az 6 karakter").max(200),
})

export async function createPartnerCompany(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authError = await requireOwnerOrUfo()
  if (authError) return authError

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    passcode: formData.get("passcode"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("partner_companies").insert({
    name: parsed.data.name,
    username: parsed.data.username,
    passcode_hash: hashPasscode(parsed.data.passcode),
  })

  if (error) {
    const message = error.code === "23505" ? "Bu kullanıcı adı zaten kullanılıyor." : error.message
    return { status: "error", message: `Firma eklenemedi: ${message}` }
  }

  revalidatePartnerPages()
  return { status: "success", message: "Firma eklendi." }
}

export async function setPartnerCompanyActive(id: string, active: boolean): Promise<ActionState> {
  const authError = await requireOwnerOrUfo()
  if (authError) return authError

  const { error } = await supabase.from("partner_companies").update({ active }).eq("id", id)
  if (error) {
    return { status: "error", message: `Güncellenemedi: ${error.message}` }
  }

  revalidatePartnerPages()
  return { status: "success", message: active ? "Firma aktif edildi." : "Firma pasif edildi." }
}

const resetPasscodeSchema = z.object({
  passcode: z.string().min(6, "En az 6 karakter").max(200),
})

export async function resetPartnerCompanyPasscode(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authError = await requireOwnerOrUfo()
  if (authError) return authError

  const parsed = resetPasscodeSchema.safeParse({ passcode: formData.get("passcode") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("partner_companies")
    .update({ passcode_hash: hashPasscode(parsed.data.passcode) })
    .eq("id", id)

  if (error) {
    return { status: "error", message: `Şifre güncellenemedi: ${error.message}` }
  }

  revalidatePartnerPages()
  return { status: "success", message: "Şifre güncellendi." }
}

export async function deletePartnerCompany(id: string): Promise<ActionState> {
  const authError = await requireOwnerOrUfo()
  if (authError) return authError

  const { error } = await supabase.from("partner_companies").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Firma silinemedi: ${error.message}` }
  }

  revalidatePartnerPages()
  return { status: "success", message: "Firma silindi." }
}

const profileSchema = z.object({
  tax_id: z.string().trim().max(50).optional().or(z.literal("")),
  tax_office: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(1000).optional().or(z.literal("")),
  contact_name: z.string().trim().max(200).optional().or(z.literal("")),
  contact_phone: z.string().trim().max(50).optional().or(z.literal("")),
})

/** Taşeron firmanın kendi profilini (vergi/iletişim bilgileri) güncellemesi. */
export async function updatePartnerCompanyProfile(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authError = await requireOwnPartnerCompany(companyId)
  if (authError) return authError

  const parsed = profileSchema.safeParse({
    tax_id: formData.get("tax_id"),
    tax_office: formData.get("tax_office"),
    address: formData.get("address"),
    contact_name: formData.get("contact_name"),
    contact_phone: formData.get("contact_phone"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("partner_companies")
    .update({
      tax_id: parsed.data.tax_id || null,
      tax_office: parsed.data.tax_office || null,
      address: parsed.data.address || null,
      contact_name: parsed.data.contact_name || null,
      contact_phone: parsed.data.contact_phone || null,
    })
    .eq("id", companyId)

  if (error) {
    return { status: "error", message: `Profil kaydedilemedi: ${error.message}` }
  }

  revalidatePartnerPages()
  return { status: "success", message: "Profil kaydedildi." }
}

const MAX_TAX_DOCUMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_TAX_DOCUMENT_TYPES = ["application/pdf", "image/png", "image/jpeg"]

/** Taşeron firmanın vergi levhası dosyasını yüklemesi. */
export async function uploadPartnerTaxDocument(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authError = await requireOwnPartnerCompany(companyId)
  if (authError) return authError

  const file = formData.get("tax_document")
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Bir dosya seçin." }
  }
  if (file.size > MAX_TAX_DOCUMENT_BYTES) {
    return { status: "error", message: "Dosya 10MB'tan küçük olmalı." }
  }
  if (!ALLOWED_TAX_DOCUMENT_TYPES.includes(file.type)) {
    return { status: "error", message: "Sadece PDF, PNG veya JPG yükleyin." }
  }

  const ext = file.name.split(".").pop() || "pdf"
  const path = `${companyId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("partner-documents")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { status: "error", message: `Dosya yüklenemedi: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage.from("partner-documents").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("partner_companies")
    .update({ tax_document_url: publicUrlData.publicUrl })
    .eq("id", companyId)

  if (updateError) {
    return { status: "error", message: `Dosya kaydedilemedi: ${updateError.message}` }
  }

  revalidatePartnerPages()
  return { status: "success", message: "Vergi levhası yüklendi." }
}

const adjustBalanceSchema = z.object({
  amount: z.coerce.number().refine((n) => n !== 0, "0 olamaz"),
  note: z.string().trim().min(1, "Not zorunlu").max(500),
})

/** Owner/ufo tarafından manuel bakiye düzeltmesi (iade, düzeltme, iyi niyet kredisi vb.). */
export async function adjustPartnerBalance(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authError = await requireOwnerOrUfo()
  if (authError) return authError

  const parsed = adjustBalanceSchema.safeParse({
    amount: formData.get("amount"),
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: company, error: fetchError } = await supabase
    .from("partner_companies")
    .select("balance")
    .eq("id", companyId)
    .single()

  if (fetchError || !company) {
    return { status: "error", message: "Firma bulunamadı." }
  }

  const { error: updateError } = await supabase
    .from("partner_companies")
    .update({ balance: company.balance + parsed.data.amount })
    .eq("id", companyId)

  if (updateError) {
    return { status: "error", message: `Bakiye güncellenemedi: ${updateError.message}` }
  }

  await supabase.from("partner_transactions").insert({
    company_id: companyId,
    type: "adjustment",
    amount: parsed.data.amount,
    note: parsed.data.note,
  })

  revalidatePartnerPages()
  return { status: "success", message: "Bakiye güncellendi." }
}
