import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Resmi WhatsApp Business Platform (Cloud API, Meta) ile konuşan ince bir
 * sarmalayıcı. Evolution API'nin yerini alır.
 *
 * Gerekli ortam değişkenleri (Meta Business Suite → WhatsApp → API Setup'tan
 * alınır):
 * - WHATSAPP_ACCESS_TOKEN: kalıcı erişim token'ı (System User token'ı
 *   önerilir, quickstart'taki 24 saatlik geçici token değil).
 * - WHATSAPP_PHONE_NUMBER_ID: kayıtlı numaranın Phone Number ID'si.
 * - WHATSAPP_APP_SECRET: webhook imza doğrulaması için Meta App Secret'ı.
 * - WHATSAPP_VERIFY_TOKEN: webhook kurulumunda Meta'ya girilen doğrulama metni.
 */

interface SendResult {
  ok: boolean
  error?: string
}

const GRAPH_API_VERSION = "v21.0"

function isConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

/** WhatsApp numarasını Cloud API'nin beklediği sade rakam formatına indirger. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "")
}

export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendResult> {
  if (!isConfigured()) {
    return {
      ok: false,
      error:
        "WhatsApp Cloud API henüz yapılandırılmadı (.env.local içinde WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID boş).",
    }
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhone(phone),
          type: "text",
          text: { body: text },
        }),
      }
    )

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      return { ok: false, error: `WhatsApp API ${response.status}: ${body.slice(0, 300)}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" }
  }
}

/**
 * Meta'nın webhook isteklerine eklediği `X-Hub-Signature-256: sha256=<hex>`
 * header'ını doğrular. `rawBody` imza hesaplanmadan önce hiç parse edilmemiş
 * ham istek gövdesi olmalı.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret || !signatureHeader) return false

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex")
  const expectedHeader = `sha256=${expected}`

  const expectedBuf = Buffer.from(expectedHeader)
  const actualBuf = Buffer.from(signatureHeader)
  if (expectedBuf.length !== actualBuf.length) return false

  return timingSafeEqual(expectedBuf, actualBuf)
}
