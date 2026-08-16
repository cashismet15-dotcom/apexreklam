import "server-only"

import { supabase } from "@/lib/supabase"
import { normalizePhone, sendWhatsAppMessage } from "@/lib/yakamoz-whatsapp"
import { phoneLast10 } from "@/lib/yakamoz"
import type { YakamozContact, YakamozWaMessage } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getYakamozContacts(): Promise<YakamozContact[]> {
  const { data, error } = await supabase
    .from("yakamoz_contacts")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) fail("Kişiler alınamadı", error)
  return data
}

export async function getYakamozContactById(id: string): Promise<YakamozContact | null> {
  const { data, error } = await supabase.from("yakamoz_contacts").select("*").eq("id", id).maybeSingle()

  if (error) fail("Kişi alınamadı", error)
  return data
}

export async function getYakamozContactByPhone(phone: string): Promise<YakamozContact | null> {
  const { data, error } = await supabase
    .from("yakamoz_contacts")
    .select("*")
    .eq("phone", phone)
    .maybeSingle()

  if (error) fail("Kişi alınamadı", error)
  return data
}

export async function getYakamozMessages(contactId: string): Promise<YakamozWaMessage[]> {
  const { data, error } = await supabase
    .from("yakamoz_wa_messages")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true })

  if (error) fail("Mesajlar alınamadı", error)
  return data
}

/** Telefona (son 10 hane) göre var olan kişiyi bulur, yoksa oluşturur. */
export async function findOrCreateYakamozContact(
  phone: string,
  name: string | null
): Promise<{ id: string } | { error: string }> {
  const { data: contacts } = await supabase.from("yakamoz_contacts").select("id, phone")

  const target = contacts?.find((c) => phoneLast10(c.phone) === phoneLast10(phone))
  if (target) return { id: target.id }

  const { data: created, error } = await supabase
    .from("yakamoz_contacts")
    .insert({ phone: normalizePhone(phone), name })
    .select("id")
    .single()

  if (error || !created) return { error: error?.message ?? "Kişi oluşturulamadı" }
  return { id: created.id }
}

/** Evolution API ile gönderir + yakamoz_wa_messages'a 'giden' kaydı ekler + last_message_at günceller. ai_paused'a dokunmaz. */
export async function sendAndLogYakamozMessage(
  contactId: string,
  phone: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await sendWhatsAppMessage(phone, body)
  if (!result.ok) return { ok: false, error: result.error }

  const { error } = await supabase.from("yakamoz_wa_messages").insert({
    contact_id: contactId,
    direction: "giden",
    body,
  })
  if (error) return { ok: false, error: error.message }

  await supabase
    .from("yakamoz_contacts")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", contactId)

  return { ok: true }
}
