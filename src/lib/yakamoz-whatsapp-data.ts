import "server-only"

import { supabase } from "@/lib/supabase"
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
