import "server-only"

import { supabase } from "@/lib/supabase"
import type { YakamozJob } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getYakamozJobs(): Promise<YakamozJob[]> {
  const { data, error } = await supabase
    .from("yakamoz_jobs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) fail("Kayıtlar alınamadı", error)
  return data
}

export async function getYakamozJobById(id: string): Promise<YakamozJob | null> {
  const { data, error } = await supabase.from("yakamoz_jobs").select("*").eq("id", id).maybeSingle()

  if (error) fail("Kayıt alınamadı", error)
  return data
}
