"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getSessionRole } from "@/lib/auth-role"
import { toTeamRole } from "@/lib/panel"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"
import type { TeamMemberRole } from "@/lib/types"

async function requireTeamRole(): Promise<TeamMemberRole> {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) throw new Error("Yetkisiz.")
  return role
}

function revalidateAvailability() {
  revalidatePath("/panel/musaitlik")
}

const timeRegex = /^\d{2}:\d{2}$/

const availabilitySchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  is_open: z.coerce.boolean(),
  start_time: z.string().regex(timeRegex, "Geçerli bir saat girin"),
  end_time: z.string().regex(timeRegex, "Geçerli bir saat girin"),
})

/** 7 gün için tek seferde kaydeder — formdan gelen günlerin hepsini upsert eder. */
export async function updateAvailability(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeamRole()

  const rows = []
  for (let weekday = 0; weekday <= 6; weekday++) {
    const parsed = availabilitySchema.safeParse({
      weekday,
      is_open: formData.get(`is_open_${weekday}`) === "on",
      start_time: formData.get(`start_time_${weekday}`),
      end_time: formData.get(`end_time_${weekday}`),
    })
    if (!parsed.success) {
      return { status: "error", message: "Formda hatalar var." }
    }
    if (parsed.data.is_open && parsed.data.start_time >= parsed.data.end_time) {
      return { status: "error", message: "Başlangıç saati bitiş saatinden önce olmalı." }
    }
    rows.push(parsed.data)
  }

  const { error } = await supabase.from("booking_availability").upsert(rows, { onConflict: "weekday" })
  if (error) return { status: "error", message: error.message }

  revalidateAvailability()
  return { status: "success" }
}

const blockedDateSchema = z.object({
  blocked_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
})

export async function addBlockedDate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireTeamRole()

  const parsed = blockedDateSchema.safeParse({
    blocked_date: formData.get("blocked_date"),
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("booking_blocked_dates").insert({
    blocked_date: parsed.data.blocked_date,
    note: parsed.data.note || null,
  })
  if (error) return { status: "error", message: error.message }

  revalidateAvailability()
  return { status: "success" }
}

export async function deleteBlockedDate(id: string): Promise<ActionState> {
  await requireTeamRole()

  const { error } = await supabase.from("booking_blocked_dates").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Silinemedi: ${error.message}` }
  }

  revalidateAvailability()
  return { status: "success", message: "Silindi." }
}
