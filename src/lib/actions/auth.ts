"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, signSession, type Session } from "@/lib/session"
import type { ActionState } from "@/lib/actions/shared"

function isSafeNextPath(value: FormDataEntryValue | null): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim()
  const passcode = String(formData.get("passcode") ?? "").trim()
  const next = formData.get("next")

  let session: Session | null = null
  if (
    username &&
    passcode &&
    username === process.env.APP_OWNER_USERNAME &&
    passcode === process.env.APP_OWNER_PASSCODE
  ) {
    session = { role: "owner" }
  } else if (
    username &&
    passcode &&
    username === process.env.APP_HUSEYIN_USERNAME &&
    passcode === process.env.APP_HUSEYIN_PASSCODE
  ) {
    session = { role: "huseyin" }
  } else if (
    username &&
    passcode &&
    username === process.env.APP_BATUHAN_USERNAME &&
    passcode === process.env.APP_BATUHAN_PASSCODE
  ) {
    session = { role: "batuhan" }
  }

  if (!session) {
    return { status: "error", message: "Kullanıcı adı veya şifre hatalı." }
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, signSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  })

  if (session.role === "huseyin" || session.role === "batuhan") {
    redirect(isSafeNextPath(next) && next.startsWith("/panel") ? next : "/panel")
  }

  redirect(isSafeNextPath(next) ? next : "/")
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}
