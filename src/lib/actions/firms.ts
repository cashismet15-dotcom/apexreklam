"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getSessionRole } from "@/lib/auth-role"
import { canManageCustomers, toTeamRole } from "@/lib/panel"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"
import type { FirmStage, ServiceBilling, TeamMemberRole } from "@/lib/types"

async function requireRole(check?: (role: TeamMemberRole) => boolean): Promise<TeamMemberRole> {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role || (check && !check(role))) throw new Error("Yetkisiz.")
  return role
}

const requireFirmManager = () => requireRole(canManageCustomers)
const requireOwner = () => requireRole((r) => r === "owner")

function revalidateFirms(firmId?: string) {
  revalidatePath("/panel/firmalar")
  revalidatePath("/panel/musterilerimiz")
  if (firmId) revalidatePath(`/panel/firmalar/${firmId}`)
}

function revalidateMuhasebe() {
  revalidatePath("/muhasebe")
  revalidatePath("/muhasebe/musteriler")
  revalidatePath("/muhasebe/takvim")
  revalidatePath("/panel/sirketler")
}

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""))
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")

const firmSchema = z.object({
  name: z.string().trim().min(1, "Firma adı zorunlu").max(200),
  contact_name: optionalText(200),
  phone: optionalText(40),
  city: optionalText(100),
  firm_services: optionalText(2000),
  website: optionalText(300),
  instagram: optionalText(300),
  linkedin: optionalText(300),
  facebook: optionalText(300),
  about: optionalText(8000),
})

const FIRM_FIELDS = [
  "name",
  "contact_name",
  "phone",
  "city",
  "firm_services",
  "website",
  "instagram",
  "linkedin",
  "facebook",
  "about",
] as const

function parseFirmForm(formData: FormData) {
  const raw = Object.fromEntries(FIRM_FIELDS.map((f) => [f, formData.get(f) ?? ""]))
  const parsed = firmSchema.safeParse(raw)
  if (!parsed.success) return { ok: false as const, error: parsed.error }
  // Boş string'leri null'a çevir — veritabanında "girilmemiş" net görünsün.
  const values = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v ? v : null])
  ) as Record<(typeof FIRM_FIELDS)[number], string | null>
  return { ok: true as const, values }
}

export async function createFirm(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = await requireFirmManager()
  const parsed = parseFirmForm(formData)
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data, error } = await supabase
    .from("firms")
    .insert({ ...parsed.values, created_by: role })
    .select("id")
    .single()
  if (error) return { status: "error", message: `Firma eklenemedi: ${error.message}` }

  revalidateFirms()
  return { status: "success", message: data.id }
}

export async function updateFirm(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireFirmManager()
  const parsed = parseFirmForm(formData)
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("firms").update(parsed.values).eq("id", id)
  if (error) return { status: "error", message: `Kaydedilemedi: ${error.message}` }

  // Muhasebe kaydındaki firma adı/telefon da güncel kalsın.
  const customerPatch: Record<string, string> = { company_name: parsed.values.name! }
  if (parsed.values.phone) customerPatch.phone = parsed.values.phone
  if (parsed.values.contact_name) customerPatch.contact_name = parsed.values.contact_name
  await supabase.from("customers").update(customerPatch).eq("firm_id", id)

  revalidateFirms(id)
  revalidateMuhasebe()
  return { status: "success", message: "Firma güncellendi." }
}

export async function deleteFirm(id: string): Promise<ActionState> {
  await requireOwner()
  const { error } = await supabase.from("firms").delete().eq("id", id)
  if (error) return { status: "error", message: `Firma silinemedi: ${error.message}` }
  revalidateFirms()
  return { status: "success", message: "Firma silindi." }
}

/** Olumlu'ya geçiş sadece convertFirmToCustomer ile (hizmet + tarih seçimi gerekli). */
export async function setFirmStage(id: string, stage: FirmStage): Promise<ActionState> {
  await requireFirmManager()
  if (stage === "olumlu") {
    return { status: "error", message: "Olumlu için 'Müşteri Yap' adımını kullanın." }
  }
  const { error } = await supabase
    .from("firms")
    .update({ stage, stage_changed_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { status: "error", message: `Aşama güncellenemedi: ${error.message}` }
  revalidateFirms(id)
  return { status: "success" }
}

const noteSchema = z.object({ body: z.string().trim().min(1, "Not boş olamaz").max(8000) })

export async function addFirmNote(
  firmId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const role = await requireFirmManager()
  const parsed = noteSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    return { status: "error", message: "Not boş olamaz.", fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { error } = await supabase
    .from("firm_notes")
    .insert({ firm_id: firmId, body: parsed.data.body, author: role })
  if (error) return { status: "error", message: `Not eklenemedi: ${error.message}` }
  revalidateFirms(firmId)
  return { status: "success", message: "Not eklendi." }
}

export async function deleteFirmNote(noteId: string): Promise<ActionState> {
  await requireFirmManager()
  const { data, error } = await supabase
    .from("firm_notes")
    .delete()
    .eq("id", noteId)
    .select("firm_id")
    .single()
  if (error) return { status: "error", message: `Not silinemedi: ${error.message}` }
  revalidateFirms(data?.firm_id)
  return { status: "success" }
}

// ---------------------------------------------------------------------------
// Hizmetler kataloğu — sadece owner (fiyatlar sadece onda görünüyor).
// ---------------------------------------------------------------------------

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Hizmet adı zorunlu").max(200),
  description: optionalText(2000),
  price: z.coerce.number().min(0, "Fiyat 0 veya daha büyük olmalı"),
  billing: z.enum(["aylik", "tek_seferlik"]),
})

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    billing: formData.get("billing"),
  })
}

export async function createService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner()
  const parsed = parseServiceForm(formData)
  if (!parsed.success) {
    return { status: "error", message: "Formda hatalar var.", fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { error } = await supabase
    .from("services")
    .insert({ ...parsed.data, description: parsed.data.description || null })
  if (error) return { status: "error", message: `Hizmet eklenemedi: ${error.message}` }
  revalidatePath("/panel/hizmetler")
  return { status: "success", message: "Hizmet eklendi." }
}

export async function updateService(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireOwner()
  const parsed = parseServiceForm(formData)
  if (!parsed.success) {
    return { status: "error", message: "Formda hatalar var.", fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { error } = await supabase
    .from("services")
    .update({ ...parsed.data, description: parsed.data.description || null })
    .eq("id", id)
  if (error) return { status: "error", message: `Kaydedilemedi: ${error.message}` }
  revalidatePath("/panel/hizmetler")
  return { status: "success", message: "Hizmet güncellendi." }
}

export async function setServiceActive(id: string, active: boolean): Promise<ActionState> {
  await requireOwner()
  const { error } = await supabase.from("services").update({ active }).eq("id", id)
  if (error) return { status: "error", message: `Güncellenemedi: ${error.message}` }
  revalidatePath("/panel/hizmetler")
  return { status: "success" }
}

export async function deleteService(id: string): Promise<ActionState> {
  await requireOwner()
  // firm_services.service_id "set null" — firmaların mevcut anlaşmaları korunur.
  const { error } = await supabase.from("services").delete().eq("id", id)
  if (error) return { status: "error", message: `Hizmet silinemedi: ${error.message}` }
  revalidatePath("/panel/hizmetler")
  return { status: "success", message: "Hizmet silindi." }
}

// ---------------------------------------------------------------------------
// Olumlu → Müşteri Yap: hizmetler + başlangıç/ilk ödeme tarihi seçilir,
// aylık hizmet toplamıyla Muhasebe'de kayıt açılır.
// ---------------------------------------------------------------------------

const convertSchema = z.object({
  start_date: dateString,
  first_payment_date: dateString,
  items: z
    .array(
      z.object({
        service_id: z.string().uuid(),
        price: z.coerce.number().min(0, "Fiyat 0 veya daha büyük olmalı"),
      })
    )
    .min(1, "En az bir hizmet seçin"),
})

export async function convertFirmToCustomer(
  firmId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireOwner()

  let items: unknown = []
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"))
  } catch {
    return { status: "error", message: "Hizmet seçimi okunamadı." }
  }

  const parsed = convertSchema.safeParse({
    start_date: formData.get("start_date"),
    first_payment_date: formData.get("first_payment_date"),
    items,
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const [{ data: firm, error: firmError }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase.from("firms").select("*").eq("id", firmId).maybeSingle(),
      supabase
        .from("services")
        .select("id, name, billing")
        .in(
          "id",
          parsed.data.items.map((i) => i.service_id)
        ),
    ])
  if (firmError || !firm) return { status: "error", message: "Firma bulunamadı." }
  if (servicesError) return { status: "error", message: `Hizmetler alınamadı: ${servicesError.message}` }

  const serviceById = new Map((services ?? []).map((s) => [s.id, s]))
  const rows = parsed.data.items.flatMap((item) => {
    const service = serviceById.get(item.service_id)
    if (!service) return []
    return [
      {
        firm_id: firmId,
        service_id: service.id,
        name: service.name as string,
        price: item.price,
        billing: service.billing as ServiceBilling,
        start_date: parsed.data.start_date,
        // Tek seferlik hizmet ilk ödeme tarihinde tahsil edilir.
        due_date: service.billing === "tek_seferlik" ? parsed.data.first_payment_date : null,
      },
    ]
  })
  if (rows.length === 0) return { status: "error", message: "Seçilen hizmetler bulunamadı." }

  const { error: insertError } = await supabase.from("firm_services").insert(rows)
  if (insertError) return { status: "error", message: `Hizmetler kaydedilemedi: ${insertError.message}` }

  // Aylık hizmet varsa Muhasebe'de tahsilat kaydı aç (zaten bağlı kayıt varsa ücreti güncelle).
  const monthlyFee = rows.filter((r) => r.billing === "aylik").reduce((acc, r) => acc + r.price, 0)
  if (monthlyFee > 0) {
    const paymentDay = Number(parsed.data.first_payment_date.slice(8, 10))
    const { data: existing } = await supabase
      .from("customers")
      .select("id, monthly_fee")
      .eq("firm_id", firmId)
      .maybeSingle()

    const { error: customerError } = existing
      ? await supabase
          .from("customers")
          .update({ monthly_fee: Number(existing.monthly_fee) + monthlyFee, status: "aktif" })
          .eq("id", existing.id)
      : await supabase.from("customers").insert({
          firm_id: firmId,
          company_name: firm.name,
          contact_name: firm.contact_name || firm.name,
          phone: firm.phone || "-",
          monthly_fee: monthlyFee,
          payment_day: paymentDay,
          // Tahsilat başlangıcı = ilk ödeme tarihi; vadeler bundan önceye düşmez.
          start_date: parsed.data.first_payment_date,
          status: "aktif",
        })
    if (customerError) {
      return { status: "error", message: `Muhasebe kaydı açılamadı: ${customerError.message}` }
    }
  }

  const { error: stageError } = await supabase
    .from("firms")
    .update({ stage: "olumlu", stage_changed_at: new Date().toISOString() })
    .eq("id", firmId)
  if (stageError) return { status: "error", message: `Aşama güncellenemedi: ${stageError.message}` }

  revalidateFirms(firmId)
  revalidateMuhasebe()
  return { status: "success", message: "Firma müşterilerimize eklendi." }
}

export async function removeFirmService(firmServiceId: string): Promise<ActionState> {
  await requireOwner()
  const { data, error } = await supabase
    .from("firm_services")
    .delete()
    .eq("id", firmServiceId)
    .select("firm_id, price, billing")
    .single()
  if (error) return { status: "error", message: `Hizmet kaldırılamadı: ${error.message}` }

  // Aylık hizmet kaldırıldıysa Muhasebe'deki aylık ücreti de düş.
  if (data.billing === "aylik") {
    const { data: customer } = await supabase
      .from("customers")
      .select("id, monthly_fee")
      .eq("firm_id", data.firm_id)
      .maybeSingle()
    if (customer) {
      const next = Number(customer.monthly_fee) - Number(data.price)
      // monthly_fee > 0 kısıtı var — son aylık hizmet de kalkarsa kaydı pasife al.
      await supabase
        .from("customers")
        .update(next > 0 ? { monthly_fee: next } : { status: "pasif" })
        .eq("id", customer.id)
    }
  }

  revalidateFirms(data.firm_id)
  revalidateMuhasebe()
  return { status: "success" }
}

/** Tek seferlik hizmeti tahsil edildi / edilmedi olarak işaretler. */
export async function setOneTimePaid(firmServiceId: string, paid: boolean): Promise<ActionState> {
  await requireOwner()
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" })
  const { data, error } = await supabase
    .from("firm_services")
    .update({ paid_at: paid ? today : null })
    .eq("id", firmServiceId)
    .eq("billing", "tek_seferlik")
    .select("firm_id")
    .single()
  if (error) return { status: "error", message: `Güncellenemedi: ${error.message}` }
  revalidateFirms(data.firm_id)
  revalidateMuhasebe()
  return { status: "success" }
}
