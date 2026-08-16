"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import { YAKAMOZ_IL } from "@/lib/tr-locations"
import type { ActionState } from "@/lib/actions/shared"
import type { YakamozJobStatus } from "@/lib/types"

const yakamozJobSchema = z.object({
  customer_name: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Telefon zorunlu").max(50),
  il: z.string().trim().min(1).max(100),
  ilce: z.string().trim().min(1, "İlçe zorunlu").max(100),
  mahalle: z.string().trim().max(150).optional().or(z.literal("")),
  address_text: z.string().trim().max(1000).optional().or(z.literal("")),
  lat: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(-90).max(90).optional()
  ),
  lng: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(-180).max(180).optional()
  ),
  price_per_m2: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0, "0 veya üzeri olmalı").optional()
  ),
  requested_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
    .optional()
    .or(z.literal("")),
  requested_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Geçerli bir saat girin")
    .optional()
    .or(z.literal("")),
  status: z.enum(["siparis_alindi", "yikamada", "bitti", "yolda"]),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
})

function parseYakamozJobForm(formData: FormData) {
  return yakamozJobSchema.safeParse({
    customer_name: formData.get("customer_name"),
    phone: formData.get("phone"),
    il: formData.get("il") || YAKAMOZ_IL,
    ilce: formData.get("ilce"),
    mahalle: formData.get("mahalle"),
    address_text: formData.get("address_text"),
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
    price_per_m2: formData.get("price_per_m2") || "",
    requested_date: formData.get("requested_date") || undefined,
    requested_time: formData.get("requested_time") || undefined,
    status: formData.get("status") || "siparis_alindi",
    note: formData.get("note"),
  })
}

function revalidateYakamozPages() {
  revalidatePath("/yakamoz")
}

function toInsertPayload(data: z.infer<typeof yakamozJobSchema>) {
  return {
    customer_name: data.customer_name || null,
    phone: data.phone,
    il: data.il,
    ilce: data.ilce,
    mahalle: data.mahalle || null,
    address_text: data.address_text || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    price_per_m2: data.price_per_m2 ?? null,
    requested_date: data.requested_date || null,
    requested_time: data.requested_time || null,
    note: data.note || null,
  }
}

async function logStatus(jobId: string, status: YakamozJobStatus) {
  await supabase.from("yakamoz_status_log").insert({ job_id: jobId, status })
}

export async function createYakamozJob(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseYakamozJobForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data, error } = await supabase
    .from("yakamoz_jobs")
    .insert({
      ...toInsertPayload(parsed.data),
      status: "siparis_alindi",
      status_changed_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    return { status: "error", message: `Kayıt eklenemedi: ${error.message}` }
  }

  await logStatus(data.id, "siparis_alindi")

  revalidateYakamozPages()
  return { status: "success", message: "Kayıt eklendi." }
}

export async function updateYakamozJob(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseYakamozJobForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: current } = await supabase
    .from("yakamoz_jobs")
    .select("status")
    .eq("id", id)
    .maybeSingle()

  const statusChanged = current && current.status !== parsed.data.status

  const { error } = await supabase
    .from("yakamoz_jobs")
    .update({
      ...toInsertPayload(parsed.data),
      status: parsed.data.status,
      ...(statusChanged ? { status_changed_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)

  if (error) {
    return { status: "error", message: `Kayıt güncellenemedi: ${error.message}` }
  }

  if (statusChanged) await logStatus(id, parsed.data.status)

  revalidateYakamozPages()
  return { status: "success", message: "Kayıt güncellendi." }
}

export async function updateYakamozJobStatus(
  id: string,
  status: YakamozJobStatus
): Promise<ActionState> {
  const { error } = await supabase
    .from("yakamoz_jobs")
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { status: "error", message: `Durum güncellenemedi: ${error.message}` }
  }

  await logStatus(id, status)

  revalidateYakamozPages()
  return { status: "success", message: "Durum güncellendi." }
}

export async function deleteYakamozJob(id: string): Promise<ActionState> {
  const { error } = await supabase.from("yakamoz_jobs").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Kayıt silinemedi: ${error.message}` }
  }

  revalidateYakamozPages()
  return { status: "success", message: "Kayıt silindi." }
}
