import "server-only"

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const KEY_LENGTH = 64

export function hashPasscode(passcode: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(passcode, salt, KEY_LENGTH).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPasscode(passcode: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false

  const expected = scryptSync(passcode, salt, KEY_LENGTH)
  const actual = Buffer.from(hash, "hex")
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}
