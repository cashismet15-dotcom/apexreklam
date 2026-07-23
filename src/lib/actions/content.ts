"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

function revalidateContentPages(customerId?: string) {
  revalidatePath("/icerik-takip")
  if (customerId) revalidatePath(`/icerik-takip/${customerId}`)
}

const contentWeekSchema = z.object({
  status: z.enum(["talimat_bekliyor", "hazirlaniyor", "onayda", "yayinlandi"]),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
  video_url: z.string().trim().max(500).optional().or(z.literal("")),
})

export async function upsertContentWeek(
  customerId: string,
  weekStart: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = contentWeekSchema.safeParse({
    status: formData.get("status"),
    note: formData.get("note"),
    video_url: formData.get("video_url"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("content_weeks").upsert(
    {
      customer_id: customerId,
      week_start: weekStart,
      status: parsed.data.status,
      note: parsed.data.note || null,
      video_url: parsed.data.video_url || null,
    },
    { onConflict: "customer_id,week_start" }
  )

  if (error) {
    return { status: "error", message: `Kaydedilemedi: ${error.message}` }
  }

  revalidateContentPages(customerId)
  return { status: "success", message: "Bu haftanın durumu kaydedildi." }
}

const profileSchema = z.object({
  content_notes: z.string().trim().max(4000).optional().or(z.literal("")),
})

export async function updateContentNotes(
  customerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    content_notes: formData.get("content_notes"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("customers")
    .update({ content_notes: parsed.data.content_notes || null })
    .eq("id", customerId)

  if (error) {
    return { status: "error", message: `Kaydedilemedi: ${error.message}` }
  }

  revalidateContentPages(customerId)
  return { status: "success", message: "Talimatlar kaydedildi." }
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]

export async function uploadClientLogo(
  customerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("logo")
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Bir dosya seçin." }
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { status: "error", message: "Dosya 5MB'tan küçük olmalı." }
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { status: "error", message: "Sadece PNG, JPG, WEBP veya SVG yükleyin." }
  }

  const ext = file.name.split(".").pop() || "png"
  const path = `${customerId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("client-logos")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { status: "error", message: `Logo yüklenemedi: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage.from("client-logos").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("customers")
    .update({ logo_url: publicUrlData.publicUrl })
    .eq("id", customerId)

  if (updateError) {
    return { status: "error", message: `Logo kaydedilemedi: ${updateError.message}` }
  }

  revalidateContentPages(customerId)
  return { status: "success", message: "Logo yüklendi." }
}
