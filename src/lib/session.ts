import { createHmac, timingSafeEqual } from "node:crypto"

export type AppRole = "owner" | "ufo"

export const SESSION_COOKIE = "apex_session"

function sign(role: AppRole): string {
  const secret = process.env.APP_SESSION_SECRET ?? ""
  const signature = createHmac("sha256", secret).update(role).digest("base64url")
  return `${role}.${signature}`
}

export function signRole(role: AppRole): string {
  return sign(role)
}

export function verifySessionValue(value?: string | null): AppRole | null {
  if (!value) return null
  const [role] = value.split(".")
  if (role !== "owner" && role !== "ufo") return null

  const expected = sign(role)
  const expectedBuf = Buffer.from(expected)
  const valueBuf = Buffer.from(value)
  if (expectedBuf.length !== valueBuf.length) return null

  return timingSafeEqual(expectedBuf, valueBuf) ? role : null
}
