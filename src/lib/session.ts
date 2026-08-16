import { createHmac, timingSafeEqual } from "node:crypto"

export type AppRole = "owner" | "ufo" | "partner" | "yakamoz"

export interface Session {
  role: AppRole
  /** Sadece role === "partner" için dolu — o taşeron firmanın partner_companies.id'si. */
  companyId?: string
}

export const SESSION_COOKIE = "apex_session"

function payloadString(session: Session): string {
  return session.role === "partner" && session.companyId
    ? `partner:${session.companyId}`
    : session.role
}

function sign(payload: string): string {
  const secret = process.env.APP_SESSION_SECRET ?? ""
  const signature = createHmac("sha256", secret).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function signSession(session: Session): string {
  return sign(payloadString(session))
}

export function verifySessionValue(value?: string | null): Session | null {
  if (!value) return null
  const [payload] = value.split(".")
  if (!payload) return null

  let session: Session
  if (payload === "owner" || payload === "ufo" || payload === "yakamoz") {
    session = { role: payload }
  } else if (payload.startsWith("partner:")) {
    const companyId = payload.slice("partner:".length)
    if (!companyId) return null
    session = { role: "partner", companyId }
  } else {
    return null
  }

  const expected = sign(payload)
  const expectedBuf = Buffer.from(expected)
  const valueBuf = Buffer.from(value)
  if (expectedBuf.length !== valueBuf.length) return null

  return timingSafeEqual(expectedBuf, valueBuf) ? session : null
}
