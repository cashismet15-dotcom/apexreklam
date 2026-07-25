import "server-only"

import { supabase } from "@/lib/supabase"
import type { UfoJob } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getUfoJobs(): Promise<UfoJob[]> {
  const { data, error } = await supabase
    .from("ufo_jobs")
    .select("*")
    .order("job_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) fail("İşler alınamadı", error)
  return data
}

export async function getUfoJobById(id: string): Promise<UfoJob | null> {
  const { data, error } = await supabase.from("ufo_jobs").select("*").eq("id", id).maybeSingle()

  if (error) fail("İş alınamadı", error)
  return data
}
