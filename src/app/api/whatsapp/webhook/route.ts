import { NextRequest, NextResponse } from "next/server"

import { verifyWebhookSignature } from "@/lib/whatsapp"
import { supabase } from "@/lib/supabase"

/**
 * Meta WhatsApp Cloud API webhook'u. Meta Business Suite'te bu URL'i
 * (https://<domain>/api/whatsapp/webhook) ve WHATSAPP_VERIFY_TOKEN ile aynı
 * doğrulama metnini webhook ayarlarına gireceksin — GET isteği o kurulum
 * sırasında bir kez çalışır. Gelen mesaj olayları POST ile buraya düşer.
 */

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WhatsAppWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string }; wa_id: string }[]
        messages?: WhatsAppMessage[]
      }
    }[]
  }[]
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode")
  const token = request.nextUrl.searchParams.get("hub.verify_token")
  const challenge = request.nextUrl.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "verification failed" }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-hub-signature-256")

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload

  const value = payload.entry?.[0]?.changes?.[0]?.value
  const message = value?.messages?.[0]
  if (!message || message.type !== "text" || !message.text?.body) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const phone = message.from
  const pushName = value?.contacts?.[0]?.profile?.name ?? null
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from("crm_contacts")
    .select("id, name")
    .eq("phone", phone)
    .maybeSingle()

  let contactId: string

  if (existing) {
    contactId = existing.id
    await supabase
      .from("crm_contacts")
      .update({
        last_message_at: now,
        ...(pushName && !existing.name ? { name: pushName } : {}),
      })
      .eq("id", contactId)
  } else {
    const { data: created, error } = await supabase
      .from("crm_contacts")
      .insert({ phone, name: pushName, last_message_at: now })
      .select("id")
      .single()

    if (error || !created) {
      return NextResponse.json({ error: "contact insert failed" }, { status: 500 })
    }
    contactId = created.id
  }

  await supabase.from("crm_messages").insert({
    contact_id: contactId,
    direction: "gelen",
    body: message.text.body,
    whatsapp_message_id: message.id,
  })

  return NextResponse.json({ ok: true })
}
