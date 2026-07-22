"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")

const customerSchema = z.object({
  company_name: z.string().trim().min(1, "Firma adı zorunlu").max(200),
  contact_name: z.string().trim().min(1, "Yetkili zorunlu").max(200),
  phone: z.string().trim().min(1, "Telefon zorunlu").max(40),
  monthly_fee: z.coerce.number().positive("0'dan büyük olmalı"),
  payment_day: z.coerce
    .number()
    .int("Tam sayı girin")
    .min(1, "1-31 arası olmalı")
    .max(31, "1-31 arası olmalı"),
  start_date: dateString,
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

const statusSchema = z.enum(["aktif", "pasif"])

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name"),
    phone: formData.get("phone"),
    monthly_fee: formData.get("monthly_fee"),
    payment_day: formData.get("payment_day"),
    start_date: formData.get("start_date"),
    notes: formData.get("notes"),
  })
}

function revalidateCustomerPages() {
  revalidatePath("/muhasebe/musteriler")
  revalidatePath("/muhasebe/odemeler")
  revalidatePath("/muhasebe/takvim")
  revalidatePath("/muhasebe")
}

export async function createCustomer(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseCustomerForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { notes, ...rest } = parsed.data
  const { error } = await supabase
    .from("customers")
    .insert({ ...rest, notes: notes || null, status: "aktif" })

  if (error) {
    return { status: "error", message: `Müşteri eklenemedi: ${error.message}` }
  }

  revalidateCustomerPages()
  return { status: "success", message: "Müşteri eklendi." }
}

export async function updateCustomer(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseCustomerForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const statusParsed = statusSchema.safeParse(formData.get("status"))
  if (!statusParsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: { status: ["Geçerli bir durum seçin"] },
    }
  }

  const { notes, ...rest } = parsed.data
  const { error } = await supabase
    .from("customers")
    .update({ ...rest, notes: notes || null, status: statusParsed.data })
    .eq("id", id)

  if (error) {
    return { status: "error", message: `Müşteri güncellenemedi: ${error.message}` }
  }

  revalidateCustomerPages()
  return { status: "success", message: "Müşteri güncellendi." }
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  const { error } = await supabase.from("customers").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Müşteri silinemedi: ${error.message}` }
  }

  revalidateCustomerPages()
  return { status: "success", message: "Müşteri silindi." }
}
