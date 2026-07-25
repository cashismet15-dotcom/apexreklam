import "server-only"

import { cookies } from "next/headers"

import { SESSION_COOKIE, verifySessionValue, type AppRole } from "@/lib/session"

export async function getSessionRole(): Promise<AppRole | null> {
  const cookieStore = await cookies()
  return verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value)
}
