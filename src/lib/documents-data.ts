import "server-only"

import { supabase } from "@/lib/supabase"
import type { DocumentFile } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getDocuments(): Promise<DocumentFile[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) fail("Dökümanlar alınamadı", error)
  return data
}
