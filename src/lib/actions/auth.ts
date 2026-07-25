"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, signRole, type AppRole } from "@/lib/session"
import type { ActionState } from "@/lib/actions/shared"

function isSafeNextPath(value: FormDataEntryValue | null): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim()
  const passcode = String(formData.get("passcode") ?? "").trim()
  const next = formData.get("next")

  let role: AppRole | null = null
  if (
    username &&
    passcode &&
    username === process.env.APP_OWNER_USERNAME &&
    passcode === process.env.APP_OWNER_PASSCODE
  ) {
    role = "owner"
  } else if (
    username &&
    passcode &&
    username === process.env.APP_UFO_USERNAME &&
    passcode === process.env.APP_UFO_PASSCODE
  ) {
    role = "ufo"
  }

  if (!role) {
    return { status: "error", message: "Kullanıcı adı veya şifre hatalı." }
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, signRole(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  })

  if (role === "ufo") {
    redirect(isSafeNextPath(next) && next.startsWith("/ufo-temizlik") ? next : "/ufo-temizlik")
  }

  redirect(isSafeNextPath(next) ? next : "/")
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}
