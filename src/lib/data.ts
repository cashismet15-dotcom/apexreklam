import "server-only"

import { supabase } from "@/lib/supabase"
import type { ContentWeek, Customer, Payment, PaymentWithCustomer } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) fail("Müşteriler alınamadı", error)
  return data
}

export async function getCustomersForSelect(): Promise<
  Pick<Customer, "id" | "company_name" | "contact_name" | "monthly_fee">[]
> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,company_name,contact_name,monthly_fee")
    .eq("status", "aktif")
    .order("company_name", { ascending: true })

  if (error) fail("Müşteriler alınamadı", error)
  return data
}

export async function getPayments(): Promise<PaymentWithCustomer[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, customer:customers(id,company_name,contact_name)")
    .order("payment_date", { ascending: false })

  if (error) fail("Ödemeler alınamadı", error)
  return data as unknown as PaymentWithCustomer[]
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) fail("Müşteri alınamadı", error)
  return data
}

export async function getPaymentsForCustomer(customerId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("payment_date", { ascending: false })

  if (error) fail("Ödemeler alınamadı", error)
  return data
}

export interface DashboardData {
  customers: Customer[]
  payments: PaymentWithCustomer[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const [customers, payments] = await Promise.all([getCustomers(), getPayments()])
  return { customers, payments }
}

export async function getContentWeeksForWeek(weekStart: string): Promise<ContentWeek[]> {
  const { data, error } = await supabase
    .from("content_weeks")
    .select("*")
    .eq("week_start", weekStart)

  if (error) fail("İçerik durumları alınamadı", error)
  return data
}

export async function getContentWeeksForCustomer(customerId: string): Promise<ContentWeek[]> {
  const { data, error } = await supabase
    .from("content_weeks")
    .select("*")
    .eq("customer_id", customerId)
    .order("week_start", { ascending: false })

  if (error) fail("İçerik geçmişi alınamadı", error)
  return data
}
