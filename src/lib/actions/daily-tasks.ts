"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

function revalidateDailyTasks() {
  revalidatePath("/gorevler")
}

const nameSchema = z.object({
  name: z.string().trim().min(1, "Ad gerekli").max(120),
})

export async function addPerson(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = nameSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { count } = await supabase
    .from("daily_task_people")
    .select("id", { count: "exact", head: true })

  const { error } = await supabase
    .from("daily_task_people")
    .insert({ name: parsed.data.name, sort_order: count ?? 0 })

  if (error) {
    return { status: "error", message: `Kişi eklenemedi: ${error.message}` }
  }

  revalidateDailyTasks()
  return { status: "success", message: "Kişi eklendi." }
}

export async function renamePerson(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = nameSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("daily_task_people")
    .update({ name: parsed.data.name })
    .eq("id", id)

  if (error) {
    return { status: "error", message: `Kişi güncellenemedi: ${error.message}` }
  }

  revalidateDailyTasks()
  return { status: "success", message: "Kişi güncellendi." }
}

export async function removePerson(id: string): Promise<ActionState> {
  const { error } = await supabase.from("daily_task_people").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Kişi silinemedi: ${error.message}` }
  }

  revalidateDailyTasks()
  return { status: "success", message: "Kişi silindi." }
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "Görev başlığı gerekli").max(200),
})

export async function addTask(
  personId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = taskSchema.safeParse({ title: formData.get("title") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { count } = await supabase
    .from("daily_tasks")
    .select("id", { count: "exact", head: true })
    .eq("person_id", personId)

  const { error } = await supabase
    .from("daily_tasks")
    .insert({ person_id: personId, title: parsed.data.title, sort_order: count ?? 0 })

  if (error) {
    return { status: "error", message: `Görev eklenemedi: ${error.message}` }
  }

  revalidateDailyTasks()
  return { status: "success", message: "Görev eklendi." }
}

export async function removeTask(id: string): Promise<ActionState> {
  const { error } = await supabase.from("daily_tasks").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Görev silinemedi: ${error.message}` }
  }

  revalidateDailyTasks()
  return { status: "success", message: "Görev silindi." }
}

export async function setTaskDone(
  taskId: string,
  logDate: string,
  done: boolean
): Promise<ActionState> {
  const { error } = await supabase.from("daily_task_logs").upsert(
    { task_id: taskId, log_date: logDate, done, done_at: new Date().toISOString() },
    { onConflict: "task_id,log_date" }
  )

  if (error) {
    return { status: "error", message: `Kaydedilemedi: ${error.message}` }
  }

  revalidateDailyTasks()
  return { status: "success" }
}
