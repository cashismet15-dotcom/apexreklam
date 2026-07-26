"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { normalizePhone, sendWhatsAppMessage } from "@/lib/whatsapp"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

function revalidateCrmPages() {
  revalidatePath("/musteri-takip")
  revalidatePath("/musteri-takip/[id]", "page")
  revalidatePath("/musteri-takip/ayarlar")
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "İsim zorunlu").max(200),
  phone: z.string().trim().min(5, "Geçerli bir telefon girin").max(30),
  city: z.string().trim().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(5000).optional().or(z.literal("")),
})

/** Manuel kişi ekleme — WhatsApp entegrasyonu bağlanana kadar CRM'i test edebilmek için. */
export async function createCrmContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    note: formData.get("note"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: contact, error } = await supabase
    .from("crm_contacts")
    .insert({
      name: parsed.data.name,
      phone: normalizePhone(parsed.data.phone),
      city: parsed.data.city || null,
    })
    .select("id")
    .single()

  if (error) {
    const message = error.code === "23505" ? "Bu telefon numarası zaten kayıtlı." : error.message
    return { status: "error", message: `Kişi eklenemedi: ${message}` }
  }

  if (parsed.data.note) {
    await supabase
      .from("crm_contact_notes")
      .insert({ contact_id: contact.id, body: parsed.data.note })
  }

  revalidateCrmPages()
  return { status: "success", message: "Kişi eklendi." }
}

const addNoteSchema = z.object({
  body: z.string().trim().min(1, "Not boş olamaz").max(5000),
})

export async function addContactNote(
  contactId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = addNoteSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("crm_contact_notes")
    .insert({ contact_id: contactId, body: parsed.data.body })

  if (error) {
    return { status: "error", message: `Not kaydedilemedi: ${error.message}` }
  }

  revalidateCrmPages()
  return { status: "success", message: "Not eklendi." }
}

async function logOutgoingMessage(contactId: string, phone: string, body: string): Promise<ActionState> {
  const result = await sendWhatsAppMessage(phone, body)
  if (!result.ok) {
    return { status: "error", message: `Mesaj gönderilemedi: ${result.error}` }
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from("crm_messages").insert({
    contact_id: contactId,
    direction: "giden",
    body,
  })
  if (error) {
    return { status: "error", message: `Mesaj gönderildi ama kaydedilemedi: ${error.message}` }
  }

  await supabase.from("crm_contacts").update({ last_message_at: now }).eq("id", contactId)

  revalidateCrmPages()
  return { status: "success", message: "Mesaj gönderildi." }
}

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Mesaj boş olamaz").max(4000),
})

export async function sendManualMessage(
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

export async function sendQuickReply(
  contactId: string,
  phone: string,
  quickReplyId: string
): Promise<ActionState> {
  const { data: quickReply, error: quickReplyError } = await supabase
    .from("crm_quick_replies")
    .select("message")
    .eq("id", quickReplyId)
    .single()

  if (quickReplyError || !quickReply) {
    return { status: "error", message: "Hazır yanıt bulunamadı." }
  }

  return logOutgoingMessage(contactId, phone, quickReply.message)
}

const quickReplySchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunlu").max(100),
  message: z.string().trim().min(1, "Mesaj zorunlu").max(2000),
})

function parseQuickReplyForm(formData: FormData) {
  return quickReplySchema.safeParse({
    title: formData.get("title"),
    message: formData.get("message"),
  })
}

export async function createQuickReply(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseQuickReplyForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { count } = await supabase
    .from("crm_quick_replies")
    .select("id", { count: "exact", head: true })

  const { error } = await supabase.from("crm_quick_replies").insert({
    ...parsed.data,
    sort_order: count ?? 0,
  })

  if (error) {
    return { status: "error", message: `Hazır yanıt eklenemedi: ${error.message}` }
  }

  revalidateCrmPages()
  return { status: "success", message: "Hazır yanıt eklendi." }
}

export async function updateQuickReply(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseQuickReplyForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("crm_quick_replies").update(parsed.data).eq("id", id)

  if (error) {
    return { status: "error", message: `Hazır yanıt güncellenemedi: ${error.message}` }
  }

  revalidateCrmPages()
  return { status: "success", message: "Hazır yanıt güncellendi." }
}

export async function deleteQuickReply(id: string): Promise<ActionState> {
  const { error } = await supabase.from("crm_quick_replies").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Hazır yanıt silinemedi: ${error.message}` }
  }

  revalidateCrmPages()
  return { status: "success", message: "Hazır yanıt silindi." }
}
