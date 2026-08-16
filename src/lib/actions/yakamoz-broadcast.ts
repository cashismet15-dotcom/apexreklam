"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import { getYakamozJobs } from "@/lib/yakamoz-data"
import {
  findOrCreateYakamozContact,
  getYakamozContacts,
  sendAndLogYakamozMessage,
} from "@/lib/yakamoz-whatsapp-data"
import { getYakamozAllRecipients, resolveYakamozTemplate } from "@/lib/yakamoz"
import type { ActionState } from "@/lib/actions/shared"

function revalidateYakamozHaberlesmePages() {
  revalidatePath("/yakamoz-haberlesme")
  revalidatePath("/yakamoz-haberlesme/sablonlar")
  revalidatePath("/yakamoz-haberlesme/gonder")
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Tüm kayıtlı alıcılara gönderir, sonucu yakamoz_broadcasts'a loglar. Ard arda gönderimler arasında kısa bir bekleme var (spam işaretlenmesini azaltmak için). */
async function runYakamozBroadcast(body: string, title: string | null): Promise<ActionState> {
  const [jobs, contacts] = await Promise.all([getYakamozJobs(), getYakamozContacts()])
  const recipients = getYakamozAllRecipients(jobs, contacts)

  let successCount = 0
  let failedCount = 0

  for (const recipient of recipients) {
    const resolved = resolveYakamozTemplate(body, recipient.name)
    const contactResult = await findOrCreateYakamozContact(recipient.phone, recipient.name)
    if ("error" in contactResult) {
      failedCount++
      continue
    }

    const sendResult = await sendAndLogYakamozMessage(contactResult.id, recipient.phone, resolved)
    if (sendResult.ok) {
      successCount++
    } else {
      failedCount++
    }

    await sleep(300)
  }

  const { error } = await supabase.from("yakamoz_broadcasts").insert({
    title,
    body,
    recipient_count: recipients.length,
    success_count: successCount,
    failed_count: failedCount,
  })
  if (error) {
    return { status: "error", message: `Gönderim yapıldı ama kaydedilemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()

  if (recipients.length === 0) {
    return { status: "error", message: "Kayıtlı alıcı yok." }
  }

  const summary = `${successCount} başarılı, ${failedCount} başarısız (toplam ${recipients.length} alıcı).`
  return successCount > 0
    ? { status: "success", message: summary }
    : { status: "error", message: summary }
}

const broadcastSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Mesaj boş olamaz").max(4000),
})

export async function sendYakamozBroadcast(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = broadcastSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  return runYakamozBroadcast(parsed.data.body, parsed.data.title || null)
}

export async function sendYakamozSpecialDayNow(specialDayId: string): Promise<ActionState> {
  const { data: specialDay, error } = await supabase
    .from("yakamoz_special_days")
    .select("*, template:yakamoz_templates(body)")
    .eq("id", specialDayId)
    .single()

  if (error || !specialDay) {
    return { status: "error", message: "Özel gün bulunamadı." }
  }

  const body = specialDay.body || specialDay.template?.body
  if (!body) {
    return { status: "error", message: "Bu özel gün için mesaj metni yok — şablon seçin ya da metin girin." }
  }

  const result = await runYakamozBroadcast(body, specialDay.title)
  if (result.status === "success") {
    await supabase
      .from("yakamoz_special_days")
      .update({ last_sent_year: new Date().getFullYear() })
      .eq("id", specialDayId)
    revalidateYakamozHaberlesmePages()
  }

  return result
}

const templateSchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunlu").max(200),
  body: z.string().trim().min(1, "Mesaj zorunlu").max(4000),
})

export async function createYakamozTemplate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = templateSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("yakamoz_templates").insert(parsed.data)
  if (error) {
    return { status: "error", message: `Şablon eklenemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()
  return { status: "success", message: "Şablon eklendi." }
}

export async function updateYakamozTemplate(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = templateSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("yakamoz_templates").update(parsed.data).eq("id", id)
  if (error) {
    return { status: "error", message: `Şablon güncellenemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()
  return { status: "success", message: "Şablon güncellendi." }
}

export async function deleteYakamozTemplate(id: string): Promise<ActionState> {
  const { error } = await supabase.from("yakamoz_templates").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Şablon silinemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()
  return { status: "success", message: "Şablon silindi." }
}

const specialDaySchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunlu").max(200),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  template_id: z.string().trim().optional().or(z.literal("")),
  body: z.string().trim().max(4000).optional().or(z.literal("")),
})

function parseSpecialDayForm(formData: FormData) {
  return specialDaySchema.safeParse({
    title: formData.get("title"),
    month: formData.get("month"),
    day: formData.get("day"),
    template_id: formData.get("template_id"),
    body: formData.get("body"),
  })
}

export async function createYakamozSpecialDay(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseSpecialDayForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("yakamoz_special_days").insert({
    title: parsed.data.title,
    month: parsed.data.month,
    day: parsed.data.day,
    template_id: parsed.data.template_id || null,
    body: parsed.data.body || null,
  })
  if (error) {
    return { status: "error", message: `Özel gün eklenemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()
  return { status: "success", message: "Özel gün eklendi." }
}

export async function updateYakamozSpecialDay(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseSpecialDayForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("yakamoz_special_days")
    .update({
      title: parsed.data.title,
      month: parsed.data.month,
      day: parsed.data.day,
      template_id: parsed.data.template_id || null,
      body: parsed.data.body || null,
    })
    .eq("id", id)
  if (error) {
    return { status: "error", message: `Özel gün güncellenemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()
  return { status: "success", message: "Özel gün güncellendi." }
}

export async function deleteYakamozSpecialDay(id: string): Promise<ActionState> {
  const { error } = await supabase.from("yakamoz_special_days").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Özel gün silinemedi: ${error.message}` }
  }

  revalidateYakamozHaberlesmePages()
  return { status: "success", message: "Özel gün silindi." }
}
