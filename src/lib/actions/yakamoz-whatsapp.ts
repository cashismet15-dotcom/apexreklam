"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import { normalizePhone, sendWhatsAppMessage } from "@/lib/yakamoz-whatsapp"
import { phoneLast10 } from "@/lib/yakamoz"
import type { ActionState } from "@/lib/actions/shared"

function revalidateYakamozWhatsappPages() {
  revalidatePath("/yakamoz-whatsapp")
  revalidatePath("/yakamoz-whatsapp/[id]", "page")
  revalidatePath("/yakamoz-whatsapp/musteriler")
}

async function logOutgoingMessage(contactId: string, phone: string, body: string): Promise<ActionState> {
  const result = await sendWhatsAppMessage(phone, body)
  if (!result.ok) {
    return { status: "error", message: `Mesaj gönderilemedi: ${result.error}` }
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from("yakamoz_wa_messages").insert({
    contact_id: contactId,
    direction: "giden",
    body,
  })
  if (error) {
    return { status: "error", message: `Mesaj gönderildi ama kaydedilemedi: ${error.message}` }
  }

  // Personel elle yazdığında YZ asistanı bu kişiye artık otomatik cevap vermemeli.
  await supabase
    .from("yakamoz_contacts")
    .update({ last_message_at: now, ai_paused: true })
    .eq("id", contactId)

  revalidateYakamozWhatsappPages()
  return { status: "success", message: "Mesaj gönderildi." }
}

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Mesaj boş olamaz").max(4000),
})

export async function sendYakamozMessage(
  contactId: string,
  phone: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = sendMessageSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  return logOutgoingMessage(contactId, phone, parsed.data.body)
}

export async function toggleYakamozAiPaused(contactId: string, paused: boolean): Promise<ActionState> {
  const { error } = await supabase
    .from("yakamoz_contacts")
    .update({ ai_paused: paused })
    .eq("id", contactId)

  if (error) {
    return { status: "error", message: `Güncellenemedi: ${error.message}` }
  }

  revalidateYakamozWhatsappPages()
  return { status: "success", message: paused ? "YZ duraklatıldı." : "YZ tekrar aktif." }
}

const reminderSchema = z.object({
  body: z.string().trim().min(1, "Mesaj boş olamaz").max(4000),
})

export async function sendYakamozReminder(
  phone: string,
  customerName: string | null,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = reminderSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: contacts } = await supabase
    .from("yakamoz_contacts")
    .select("id, phone")

  const target = contacts?.find((c) => phoneLast10(c.phone) === phoneLast10(phone))

  let contactId: string
  if (target) {
    contactId = target.id
  } else {
    const { data: created, error } = await supabase
      .from("yakamoz_contacts")
      .insert({ phone: normalizePhone(phone), name: customerName })
      .select("id")
      .single()

    if (error || !created) {
      return { status: "error", message: `Kişi oluşturulamadı: ${error?.message}` }
    }
    contactId = created.id
  }

  return logOutgoingMessage(contactId, phone, parsed.data.body)
}
