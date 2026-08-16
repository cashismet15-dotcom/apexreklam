"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, signSession, type Session } from "@/lib/session"
import { verifyPasscode } from "@/lib/partner-auth"
import { supabase } from "@/lib/supabase"
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
    username === process.env.APP_UFO_USERNAME &&
    passcode === process.env.APP_UFO_PASSCODE
  ) {
    session = { role: "ufo" }
  } else if (
    username &&
    passcode &&
    username === process.env.APP_YAKAMOZ_USERNAME &&
    passcode === process.env.APP_YAKAMOZ_PASSCODE
  ) {
    session = { role: "yakamoz" }
  } else if (username && passcode) {
    const { data: company } = await supabase
      .from("partner_companies")
      .select("id, passcode_hash")
      .eq("username", username)
      .eq("active", true)
      .maybeSingle()

    if (company && verifyPasscode(passcode, company.passcode_hash)) {
      session = { role: "partner", companyId: company.id }
    }
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

  if (session.role === "ufo") {
    redirect(isSafeNextPath(next) && next.startsWith("/ufo-temizlik") ? next : "/ufo-temizlik")
  }

  if (session.role === "yakamoz") {
    redirect(isSafeNextPath(next) && next.startsWith("/yakamoz") ? next : "/yakamoz")
  }

  if (session.role === "partner") {
    redirect(isSafeNextPath(next) && next.startsWith("/taseron") ? next : "/taseron")
  }

  redirect(isSafeNextPath(next) ? next : "/")
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}
