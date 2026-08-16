"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

const ufoJobSchema = z
  .object({
    record_type: z.enum(["randevu", "is"]),
    category: z.enum(["ev_temizligi", "koltuk_yikama"]),
    cleaning_type: z.enum(["dolu_ev", "kiraci_sonrasi", "insaat_sonrasi"]).optional(),
    home_type: z.enum(["1+1", "2+1", "3+1", "4+1", "5+1"]).optional(),
    location: z.string().trim().max(500).optional().or(z.literal("")),
    customer_name: z.string().trim().max(200).optional().or(z.literal("")),
    customer_phone: z.string().trim().max(50).optional().or(z.literal("")),
    amount: z.coerce.number().min(0, "0 veya üzeri olmalı"),
    commission_amount: z.coerce.number().min(0, "0 veya üzeri olmalı").optional(),
    job_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
      .optional()
      .or(z.literal("")),
    job_time: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli bir saat girin").optional().or(z.literal("")),
    status: z.enum(["bekliyor", "tamamlandi", "iptal"]),
    note: z.string().trim().max(2000).optional().or(z.literal("")),
    open_to_partners: z.preprocess((v) => v === "true", z.boolean()),
    partner_rating: z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z.number().int().min(1, "1-10 arası olmalı").max(10, "1-10 arası olmalı").optional()
    ),
  })
  .refine((data) => data.category !== "ev_temizligi" || !!data.cleaning_type, {
    message: "Hizmet tipi seçin",
    path: ["cleaning_type"],
  })
  .refine((data) => data.category !== "ev_temizligi" || !!data.home_type, {
    message: "Ev tipi seçin",
    path: ["home_type"],
  })

function parseUfoJobForm(formData: FormData) {
  const recordType = formData.get("record_type")
  return ufoJobSchema.safeParse({
    record_type: recordType,
    category: formData.get("category"),
    cleaning_type: formData.get("cleaning_type") || undefined,
    home_type: formData.get("home_type") || undefined,
    location: formData.get("location"),
    customer_name: formData.get("customer_name"),
    customer_phone: formData.get("customer_phone"),
    amount: formData.get("amount"),
    commission_amount: formData.get("commission_amount") || 0,
    job_date: formData.get("job_date") || undefined,
    job_time: formData.get("job_time") || undefined,
    status: recordType === "randevu" ? "bekliyor" : formData.get("status"),
    note: formData.get("note"),
    open_to_partners: formData.get("open_to_partners"),
    partner_rating: formData.get("partner_rating"),
  })
}

function revalidateUfoPages(id?: string) {
  revalidatePath("/ufo-temizlik")
  revalidatePath("/ufo-temizlik/takvim")
  if (id) revalidatePath(`/ufo-temizlik/${id}`)
}

function toInsertPayload(data: z.infer<typeof ufoJobSchema>) {
  const isEvTemizligi = data.category === "ev_temizligi"
  return {
    record_type: data.record_type,
    category: data.category,
    cleaning_type: isEvTemizligi ? data.cleaning_type : null,
    home_type: isEvTemizligi ? data.home_type : null,
    location: data.location || null,
    customer_name: data.customer_name || null,
    customer_phone: data.customer_phone || null,
    amount: data.amount,
    commission_amount: data.commission_amount ?? 0,
    job_date: data.job_date || null,
    job_time: data.job_time || null,
    status: data.status,
    note: data.note || null,
    open_to_partners: data.open_to_partners,
    partner_rating: data.partner_rating ?? null,
  }
}

export async function createUfoJob(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseUfoJobForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("ufo_jobs").insert(toInsertPayload(parsed.data))

  if (error) {
    return { status: "error", message: `İş eklenemedi: ${error.message}` }
  }

  revalidateUfoPages()
  return { status: "success", message: "İş eklendi." }
}

export async function updateUfoJob(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseUfoJobForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const payload = toInsertPayload(parsed.data)
  const { error } = await supabase
    .from("ufo_jobs")
    .update(
      payload.open_to_partners
        ? payload
        : { ...payload, taken_by_partner_id: null, partner_taken_at: null }
    )
    .eq("id", id)

  if (error) {
    return { status: "error", message: `İş güncellenemedi: ${error.message}` }
  }

  revalidateUfoPages(id)
  return { status: "success", message: "İş güncellendi." }
}

export async function deleteUfoJob(id: string): Promise<ActionState> {
  const { error } = await supabase.from("ufo_jobs").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `İş silinemedi: ${error.message}` }
  }

  revalidateUfoPages(id)
  return { status: "success", message: "İş silindi." }
}

export async function convertUfoAppointmentToJob(id: string): Promise<ActionState> {
  const { error } = await supabase.from("ufo_jobs").update({ record_type: "is" }).eq("id", id)
  if (error) {
    return { status: "error", message: `İşe çevrilemedi: ${error.message}` }
  }

  revalidateUfoPages(id)
  return { status: "success", message: "İşe çevrildi." }
}
