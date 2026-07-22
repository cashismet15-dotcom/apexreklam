"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { findActiveCycle } from "@/lib/collections"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"

const optionalDateString = z.preprocess(
  (v) => (v === null || v === "" ? undefined : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin")
    .optional()
)

const paymentSchema = z.object({
  customer_id: z.string().trim().uuid("Müşteri seçin"),
  amount: z.coerce.number().positive("0'dan büyük olmalı"),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
  month: z.coerce.number().int().min(1, "1-12 arası olmalı").max(12, "1-12 arası olmalı"),
  year: z.coerce.number().int().min(2000).max(2100),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  expected_remaining_date: optionalDateString,
})

function parsePaymentForm(formData: FormData) {
  return paymentSchema.safeParse({
    customer_id: formData.get("customer_id"),
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    month: formData.get("month"),
    year: formData.get("year"),
    note: formData.get("note"),
    expected_remaining_date: formData.get("expected_remaining_date"),
  })
}

function revalidatePaymentPages() {
  revalidatePath("/muhasebe/odemeler")
  revalidatePath("/muhasebe/musteriler")
  revalidatePath("/muhasebe/musteriler/[id]", "page")
  revalidatePath("/muhasebe/takvim")
  revalidatePath("/muhasebe")
}

const quickPaymentSchema = z.object({
  amount: z.coerce.number().positive("0'dan büyük olmalı"),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  expected_remaining_date: optionalDateString,
})

/**
 * Tek tıkla "ödeme alındı" kaydı. Ay/yıl, müşterinin AKTİF döngüsünden alınır:
 * normalde bugünkü ay, ama geçmişte açık kalmış bir kapora bakiyesi varsa (kalanı
 * hâlâ tamamlanmadıysa) o eski aya yazılır — böylece ay değişse bile kapora
 * kalanını kapatan ödeme yanlışlıkla yeni ayın ücreti sayılmaz.
 */
export async function quickReceivePayment(
  customerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = quickPaymentSchema.safeParse({
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    note: formData.get("note"),
    expected_remaining_date: formData.get("expected_remaining_date"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("monthly_fee")
    .eq("id", customerId)
    .single()

  if (customerError || !customer) {
    return { status: "error", message: "Müşteri bulunamadı." }
  }

  const { data: existingPayments, error: existingError } = await supabase
    .from("payments")
    .select("year, month, amount")
    .eq("customer_id", customerId)

  if (existingError) {
    return { status: "error", message: `Ödeme kaydedilemedi: ${existingError.message}` }
  }

  const { year, month } = findActiveCycle(customer, existingPayments ?? [])

  const { note, expected_remaining_date, ...rest } = parsed.data
  const { error } = await supabase.from("payments").insert({
    customer_id: customerId,
    ...rest,
    month,
    year,
    note: note || null,
    expected_remaining_date: expected_remaining_date || null,
  })

  if (error) {
    return { status: "error", message: `Ödeme kaydedilemedi: ${error.message}` }
  }

  revalidatePaymentPages()
  return { status: "success", message: "Ödeme kaydedildi." }
}

export async function createPayment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parsePaymentForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { note, expected_remaining_date, ...rest } = parsed.data
  const { error } = await supabase.from("payments").insert({
    ...rest,
    note: note || null,
    expected_remaining_date: expected_remaining_date || null,
  })

  if (error) {
    return { status: "error", message: `Ödeme eklenemedi: ${error.message}` }
  }

  revalidatePaymentPages()
  return { status: "success", message: "Ödeme eklendi." }
}

export async function updatePayment(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parsePaymentForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { note, expected_remaining_date, ...rest } = parsed.data
  const { error } = await supabase
    .from("payments")
    .update({
      ...rest,
      note: note || null,
      expected_remaining_date: expected_remaining_date || null,
    })
    .eq("id", id)

  if (error) {
    return { status: "error", message: `Ödeme güncellenemedi: ${error.message}` }
  }

  revalidatePaymentPages()
  return { status: "success", message: "Ödeme güncellendi." }
}

export async function deletePayment(id: string): Promise<ActionState> {
  const { error } = await supabase.from("payments").delete().eq("id", id)
  if (error) {
    return { status: "error", message: `Ödeme silinemedi: ${error.message}` }
  }

  revalidatePaymentPages()
  return { status: "success", message: "Ödeme silindi." }
}
