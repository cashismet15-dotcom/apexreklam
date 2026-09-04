"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

const BUCKET = "documents"
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024

function revalidateDocuments() {
  revalidatePath("/gorevler/dokumanlar")
  revalidatePath("/panel/sunumlar")
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]+/g, "_")
}

export async function uploadDocuments(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const files = formData
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length === 0) {
    return { status: "error", message: "Bir dosya seçin." }
  }

  let uploaded = 0
  const errors: string[] = []

  for (const file of files) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      errors.push(`${file.name}: 25MB'tan büyük.`)
      continue
    }

    const path = `${Date.now()}-${sanitizeFileName(file.name)}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined })

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`)
      continue
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { error: insertError } = await supabase.from("documents").insert({
      name: file.name,
      file_path: path,
      file_url: publicUrlData.publicUrl,
      file_type: file.type || null,
      file_size: file.size,
    })

    if (insertError) {
      errors.push(`${file.name}: ${insertError.message}`)
      continue
    }

    uploaded += 1
  }

  revalidateDocuments()

  if (uploaded === 0) {
    return { status: "error", message: errors[0] ?? "Yüklenemedi." }
  }

  if (errors.length > 0) {
    return {
      status: "success",
      message: `${uploaded} dosya yüklendi, ${errors.length} dosya başarısız oldu.`,
    }
  }

  return { status: "success", message: `${uploaded} dosya yüklendi.` }
}

const presentationSchema = z.object({
  name: z.string().trim().min(1, "Sunum adı gerekli").max(200),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
})

/**
 * Panel > Sunumlar'dan yükleme — genel (şirkete bağlı olmayan) sunum
 * kütüphanesi. Aynı documents tablosunu/bucket'ını kullanır, sadece
 * ad/not kullanıcıdan alınır ve dosya PDF ile sınırlıdır.
 */
export async function uploadPresentation(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = presentationSchema.safeParse({
    name: formData.get("name"),
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Bir dosya seçin." }
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) {
    return { status: "error", message: "Sadece PDF yüklenebilir." }
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { status: "error", message: "Dosya 25MB'tan büyük olamaz." }
  }

  const path = `${Date.now()}-${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })

  if (uploadError) {
    return { status: "error", message: `Dosya yüklenemedi: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: insertError } = await supabase.from("documents").insert({
    name: parsed.data.name,
    file_path: path,
    file_url: publicUrlData.publicUrl,
    file_type: file.type || null,
    file_size: file.size,
    note: parsed.data.note || null,
  })

  if (insertError) {
    return { status: "error", message: `Kaydedilemedi: ${insertError.message}` }
  }

  revalidateDocuments()
  return { status: "success", message: "Sunum yüklendi." }
}

export async function deleteDocument(id: string, filePath: string): Promise<ActionState> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath])
  if (storageError) {
    return { status: "error", message: `Dosya silinemedi: ${storageError.message}` }
  }

  const { error } = await supabase.from("documents").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Kayıt silinemedi: ${error.message}` }
  }

  revalidateDocuments()
  return { status: "success", message: "Döküman silindi." }
}
