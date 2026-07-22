import "server-only"

import { supabase } from "@/lib/supabase"
import type { CrmContact, CrmMessage, CrmQuickReply } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getCrmContacts(): Promise<CrmContact[]> {
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) fail("Kişiler alınamadı", error)
  return data
}

export async function getCrmContactById(id: string): Promise<CrmContact | null> {
  const { data, error } = await supabase.from("crm_contacts").select("*").eq("id", id).maybeSingle()

  if (error) fail("Kişi alınamadı", error)
  return data
}

export async function getCrmMessages(contactId: string): Promise<CrmMessage[]> {
  const { data, error } = await supabase
    .from("crm_messages")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true })

  if (error) fail("Mesajlar alınamadı", error)
  return data
}

export async function getCrmQuickReplies(): Promise<CrmQuickReply[]> {
  const { data, error } = await supabase
    .from("crm_quick_replies")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) fail("Hazır yanıtlar alınamadı", error)
  return data
}
