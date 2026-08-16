import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { revalidatePath } from "next/cache"

import { supabase } from "@/lib/supabase"
import { YAKAMOZ_IL } from "@/lib/tr-locations"

/**
 * WhatsApp YZ asistanının topladığı bilgilerden otomatik randevu kaydı oluşturur.
 * `Authorization: Bearer <YAKAMOZ_API_KEY>` ile korunur.
 */
const orderSchema = z.object({
  phone: z.string().trim().min(1).max(50),
  customer_name: z.string().trim().max(200).optional(),
  il: z.string().trim().max(100).optional(),
  ilce: z.string().trim().min(1).max(100),
  mahalle: z.string().trim().max(150).optional(),
  address_text: z.string().trim().max(1000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  requested_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  requested_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  price_per_m2: z.number().min(0).optional(),
  note: z.string().trim().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const expectedKey = process.env.YAKAMOZ_API_KEY
  const authHeader = request.headers.get("authorization")
  const providedKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON." }, { status: 400 })
  }

  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Doğrulama hatası.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const { data: inserted, error } = await supabase
    .from("yakamoz_jobs")
    .insert({
      customer_name: data.customer_name || null,
      phone: data.phone,
      il: data.il || YAKAMOZ_IL,
      ilce: data.ilce,
      mahalle: data.mahalle || null,
      address_text: data.address_text || null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      price_per_m2: data.price_per_m2 ?? null,
      requested_date: data.requested_date || null,
      requested_time: data.requested_time || null,
      note: data.note || null,
      status: "siparis_alindi",
      status_changed_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  await supabase.from("yakamoz_status_log").insert({ job_id: inserted.id, status: "siparis_alindi" })

  revalidatePath("/yakamoz")

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 })
}
