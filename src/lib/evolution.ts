import "server-only"

/**
 * Evolution API (WhatsApp) ile konuşan ince bir sarmalayıcı.
 *
 * Evolution API sürümüne göre endpoint/gövde şekli küçük farklar gösterebilir —
 * burada en yaygın v2 şeklini kullandık (POST /message/sendText/{instance}).
 * Gerçek instance'ını bağladıktan sonra bir test mesajıyla doğrula; farklıysa
 * sadece bu dosyadaki `sendWhatsAppMessage` gövdesini/yolunu güncellemen yeterli
 * — çağıran taraflar (server action'lar) değişmeden kalır.
 */

interface SendResult {
  ok: boolean
  error?: string
}

function isConfigured(): boolean {
  return Boolean(
    process.env.EVOLUTION_API_URL &&
      process.env.EVOLUTION_API_KEY &&
      process.env.EVOLUTION_INSTANCE_NAME
  )
}

/** WhatsApp numarasını Evolution API'nin beklediği sade rakam formatına indirger. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "")
}

/** Evolution API'nin webhook'tan gönderdiği "remoteJid" (örn. 905xxxxxxxxx@s.whatsapp.net) değerinden numarayı çıkarır. */
export function phoneFromRemoteJid(remoteJid: string): string {
  return normalizePhone(remoteJid.split("@")[0] ?? remoteJid)
}

export async function sendWhatsAppMessage(phone: string, text: string): Promise<SendResult> {
  if (!isConfigured()) {
    return {
      ok: false,
      error:
        "Evolution API henüz yapılandırılmadı (.env.local içinde EVOLUTION_API_URL / EVOLUTION_API_KEY / EVOLUTION_INSTANCE_NAME boş).",
    }
  }

  const baseUrl = process.env.EVOLUTION_API_URL!.replace(/\/$/, "")
  const instance = process.env.EVOLUTION_INSTANCE_NAME!

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        number: normalizePhone(phone),
        text,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      return { ok: false, error: `Evolution API ${response.status}: ${body.slice(0, 300)}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" }
  }
}
