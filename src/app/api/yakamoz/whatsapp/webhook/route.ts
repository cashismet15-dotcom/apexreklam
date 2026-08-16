import { NextRequest, NextResponse } from "next/server"

import { phoneFromRemoteJid } from "@/lib/yakamoz-whatsapp"
import { supabase } from "@/lib/supabase"

/**
 * Evolution API bu URL'e mesaj olaylarını POST eder. Evolution instance
 * ayarlarında webhook adresi olarak şunu ver:
 *   https://<senin-domainin>/api/yakamoz/whatsapp/webhook?secret=<YAKAMOZ_EVOLUTION_WEBHOOK_SECRET>
 *
 * Evolution API sürümüne göre payload şekli değişebilir — burada v2'nin yaygın
 * "messages.upsert" olay şeklini bekliyoruz. Gerçek instance'ından gelen ilk
 * webhook'u loglayıp (aşağıdaki console.log zaten var) gerekirse extractMessageText
 * ve alan adlarını (remoteJid/pushName/message) ona göre güncelle.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessageText(message: any): string | null {
  if (!message) return null
  if (typeof message.conversation === "string") return message.conversation
  if (typeof message.extendedTextMessage?.text === "string") return message.extendedTextMessage.text
  if (typeof message.imageMessage?.caption === "string") return message.imageMessage.caption
  return null
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Yakamoz WhatsApp webhook ayakta." })
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  if (!process.env.YAKAMOZ_EVOLUTION_WEBHOOK_SECRET || secret !== process.env.YAKAMOZ_EVOLUTION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  console.log("[yakamoz-whatsapp-webhook] payload:", JSON.stringify(payload).slice(0, 2000))

  const data = payload.data ?? payload
  const remoteJid: string | undefined = data?.key?.remoteJid
  const fromMe: boolean = Boolean(data?.key?.fromMe)

  if (!remoteJid || fromMe) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const body = extractMessageText(data.message)
  if (!body) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const phone = phoneFromRemoteJid(remoteJid)
  const pushName: string | null = typeof data.pushName === "string" ? data.pushName : null
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from("yakamoz_contacts")
    .select("id, name")
    .eq("phone", phone)
    .maybeSingle()

  let contactId: string

  if (existing) {
    contactId = existing.id
    await supabase
      .from("yakamoz_contacts")
      .update({
        last_message_at: now,
        ...(pushName && !existing.name ? { name: pushName } : {}),
      })
      .eq("id", contactId)
  } else {
    const { data: created, error } = await supabase
      .from("yakamoz_contacts")
      .insert({ phone, name: pushName, last_message_at: now })
      .select("id")
      .single()

    if (error || !created) {
      return NextResponse.json({ error: "contact insert failed" }, { status: 500 })
    }
    contactId = created.id
  }

  await supabase.from("yakamoz_wa_messages").insert({
    contact_id: contactId,
    direction: "gelen",
    body,
    external_message_id: data.key?.id ?? null,
  })

  return NextResponse.json({ ok: true })
}
