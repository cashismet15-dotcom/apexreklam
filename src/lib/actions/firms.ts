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

/** Mühendis360 muhasebesi (Panel içinde) — eski işletmenin /muhasebe'sinden ayrı. */
function revalidateMuhasebe() {
  revalidatePath("/panel/muhasebe")
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

  // Mühendis360 muhasebesi: vade günü ve tahsilat başlangıcı firmada tutulur.
  // Daha önce ayarlandıysa (ek hizmet ekleniyorsa) mevcut düzen korunur.
  if (!firm.payment_day || !firm.billing_start) {
    const { error: billingError } = await supabase
      .from("firms")
      .update({
        payment_day: Number(parsed.data.first_payment_date.slice(8, 10)),
        billing_start: parsed.data.first_payment_date,
      })
      .eq("id", firmId)
    if (billingError) {
      return { status: "error", message: `Ödeme düzeni kaydedilemedi: ${billingError.message}` }
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
    .select("firm_id")
    .single()
  if (error) return { status: "error", message: `Hizmet kaldırılamadı: ${error.message}` }

  revalidateFirms(data.firm_id)
  revalidateMuhasebe()
  return { status: "success" }
}

function todayIstanbul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" })
}

/** Tek seferlik hizmetin ödemeleri fiyatı karşıladıysa paid_at'i doldurur, karşılamıyorsa temizler. */
async function syncOneTimePaidAt(firmServiceId: string) {
  const [{ data: svc }, { data: pays }] = await Promise.all([
    supabase.from("firm_services").select("price").eq("id", firmServiceId).maybeSingle(),
    supabase.from("firm_payments").select("amount, payment_date").eq("firm_service_id", firmServiceId),
  ])
  if (!svc) return
  const paid = (pays ?? []).reduce((acc, p) => acc + Number(p.amount), 0)
  const lastDate = (pays ?? []).map((p) => p.payment_date as string).sort().at(-1) ?? null
  await supabase
    .from("firm_services")
    .update({ paid_at: paid >= Number(svc.price) ? lastDate : null })
    .eq("id", firmServiceId)
}

/**
 * Tek seferlik hizmet — "Tahsil edildi": kalan tutarın tamamı bugün alındı.
 * "Geri al": bu hizmete ait tüm tahsilat kayıtları silinir.
 */
export async function setOneTimePaid(firmServiceId: string, paid: boolean): Promise<ActionState> {
  await requireOwner()
  const { data: item, error: fetchError } = await supabase
    .from("firm_services")
    .select("id, firm_id, price, name")
    .eq("id", firmServiceId)
    .eq("billing", "tek_seferlik")
    .maybeSingle()
  if (fetchError || !item) return { status: "error", message: "Hizmet bulunamadı." }

  if (paid) {
    const { data: pays } = await supabase
      .from("firm_payments")
      .select("amount")
      .eq("firm_service_id", firmServiceId)
    const alreadyPaid = (pays ?? []).reduce((acc, p) => acc + Number(p.amount), 0)
    const remaining = Math.round((Number(item.price) - alreadyPaid) * 100) / 100
    if (remaining > 0) {
      const { error: payError } = await supabase.from("firm_payments").insert({
        firm_id: item.firm_id,
        firm_service_id: item.id,
        amount: remaining,
        payment_date: todayIstanbul(),
        note: item.name,
      })
      if (payError) return { status: "error", message: `Tahsilat kaydedilemedi: ${payError.message}` }
    }
  } else {
    const { error: clearError } = await supabase
      .from("firm_payments")
      .delete()
      .eq("firm_service_id", firmServiceId)
    if (clearError) return { status: "error", message: `Güncellenemedi: ${clearError.message}` }
  }

  await syncOneTimePaidAt(firmServiceId)
  revalidateFirms(item.firm_id)
  revalidateMuhasebe()
  return { status: "success" }
}

const paymentSchema = z
  .object({
    amount: z.coerce.number().positive("Tutar 0'dan büyük olmalı"),
    payment_date: dateString,
    // "aylik" ya da tek seferlik hizmetin id'si.
    target: z.string().min(1, "Neyin ödemesi olduğunu seçin"),
    period: z.string().optional().or(z.literal("")),
    expected_remaining_date: z.string().optional().or(z.literal("")),
    note: optionalText(500),
  })
  .refine((d) => d.target !== "aylik" || /^\d{4}-\d{2}$/.test(d.period ?? ""), {
    message: "Ay seçin",
    path: ["period"],
  })
  .refine((d) => !d.expected_remaining_date || /^\d{4}-\d{2}-\d{2}$/.test(d.expected_remaining_date), {
    message: "Geçerli bir tarih girin",
    path: ["expected_remaining_date"],
  })

/**
 * Ödeme al — aylık ücret (hangi ayın) ya da tek seferlik hizmet için. Kısmi
 * olabilir; kalan için söz verilen tarih girilirse vade o tarihe kayar.
 */
export async function recordFirmPayment(
  firmId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireOwner()
  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    target: formData.get("target"),
    period: formData.get("period") ?? "",
    expected_remaining_date: formData.get("expected_remaining_date") ?? "",
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }
  const d = parsed.data
  const isMonthly = d.target === "aylik"

  if (!isMonthly) {
    const { data: svc } = await supabase
      .from("firm_services")
      .select("id")
      .eq("id", d.target)
      .eq("firm_id", firmId)
      .eq("billing", "tek_seferlik")
      .maybeSingle()
    if (!svc) return { status: "error", message: "Seçilen hizmet bu firmaya ait değil." }
  }

  const { error } = await supabase.from("firm_payments").insert({
    firm_id: firmId,
    amount: d.amount,
    payment_date: d.payment_date,
    period: isMonthly ? `${d.period}-01` : null,
    firm_service_id: isMonthly ? null : d.target,
    expected_remaining_date: d.expected_remaining_date || null,
    note: d.note || null,
  })
  if (error) return { status: "error", message: `Ödeme kaydedilemedi: ${error.message}` }

  if (!isMonthly) await syncOneTimePaidAt(d.target)

  revalidateFirms(firmId)
  revalidateMuhasebe()
  return { status: "success", message: "Ödeme kaydedildi." }
}

export async function deleteFirmPayment(paymentId: string): Promise<ActionState> {
  await requireOwner()
  const { data, error } = await supabase
    .from("firm_payments")
    .delete()
    .eq("id", paymentId)
    .select("firm_id, firm_service_id")
    .single()
  if (error) return { status: "error", message: `Ödeme silinemedi: ${error.message}` }
  // Tek seferlik tahsilat silindiyse hizmetin "ödendi" durumu yeniden hesaplanır.
  if (data.firm_service_id) await syncOneTimePaidAt(data.firm_service_id)
  revalidateFirms(data.firm_id)
  revalidateMuhasebe()
  return { status: "success" }
}
