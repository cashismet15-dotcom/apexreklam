import "server-only"

import { supabase } from "@/lib/supabase"
import type { YakamozBroadcast, YakamozSpecialDay, YakamozTemplate } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getYakamozTemplates(): Promise<YakamozTemplate[]> {
  const { data, error } = await supabase
    .from("yakamoz_templates")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) fail("Şablonlar alınamadı", error)
  return data
}

export async function getYakamozSpecialDays(): Promise<YakamozSpecialDay[]> {
  const { data, error } = await supabase
    .from("yakamoz_special_days")
    .select("*")
    .order("month", { ascending: true })
    .order("day", { ascending: true })

  if (error) fail("Özel günler alınamadı", error)
  return data
}

export async function getYakamozBroadcasts(): Promise<YakamozBroadcast[]> {
  const { data, error } = await supabase
    .from("yakamoz_broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) fail("Gönderim geçmişi alınamadı", error)
  return data
}
