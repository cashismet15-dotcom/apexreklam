import "server-only"

import { supabase } from "@/lib/supabase"
import type { BillingFirm } from "@/lib/calendar"
import type {
  Firm,
  FirmNote,
  FirmPayment,
  FirmService,
  FirmStage,
  Service,
} from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

/** Postgres numeric kolonları PostgREST'ten string gelir ("12000.00") — toplama yapmadan önce sayıya çevir. */
function withNumericPrice<T extends { price: unknown }>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r, price: Number(r.price) }))
}

function withNumericAmount<T extends { amount: unknown }>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }))
}

export async function getFirms(stages?: FirmStage[]): Promise<Firm[]> {
  let query = supabase.from("firms").select("*").order("created_at", { ascending: false })
  if (stages && stages.length > 0) query = query.in("stage", stages)
  const { data, error } = await query
  if (error) fail("Firmalar alınamadı", error)
  return (data ?? []) as Firm[]
}

export async function getFirmById(id: string): Promise<Firm | null> {
  const { data, error } = await supabase.from("firms").select("*").eq("id", id).maybeSingle()
  if (error) fail("Firma alınamadı", error)
  return data as Firm | null
}

export async function getFirmNotes(firmId: string): Promise<FirmNote[]> {
  const { data, error } = await supabase
    .from("firm_notes")
    .select("*")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false })
  if (error) fail("Notlar alınamadı", error)
  return (data ?? []) as FirmNote[]
}

export async function getFirmServices(firmId: string): Promise<FirmService[]> {
  const { data, error } = await supabase
    .from("firm_services")
    .select("*")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: true })
  if (error) fail("Firma hizmetleri alınamadı", error)
  return withNumericPrice((data ?? []) as FirmService[])
}

export async function getServices(onlyActive = false): Promise<Service[]> {
  let query = supabase.from("services").select("*").order("name", { ascending: true })
  if (onlyActive) query = query.eq("active", true)
  const { data, error } = await query
  if (error) fail("Hizmetler alınamadı", error)
  return withNumericPrice((data ?? []) as Service[])
}

/** Aşama başına firma sayısı — Firmalar sekmelerindeki sayaçlar için. */
export async function getFirmStageCounts(): Promise<Record<FirmStage, number>> {
  const { data, error } = await supabase.from("firms").select("stage")
  if (error) fail("Firma sayıları alınamadı", error)
  const counts: Record<FirmStage, number> = {
    ilk_gorusme: 0,
    teklif_verildi: 0,
    olumlu: 0,
    olumsuz: 0,
  }
  for (const row of data ?? []) counts[row.stage as FirmStage] += 1
  return counts
}


export async function getFirmPayments(firmId: string): Promise<FirmPayment[]> {
  const { data, error } = await supabase
    .from("firm_payments")
    .select("*")
    .eq("firm_id", firmId)
    .order("payment_date", { ascending: false })
  if (error) fail("Ödemeler alınamadı", error)
  return withNumericAmount((data ?? []) as FirmPayment[])
}

/** Mühendis360 muhasebesi: hizmet alan tüm firmalar + hizmetleri + ödemeleri. */
export async function getBillingFirms(): Promise<BillingFirm[]> {
  const [firmsRes, servicesRes, paymentsRes] = await Promise.all([
    supabase.from("firms").select("id, name, payment_day, billing_start").eq("stage", "olumlu"),
    supabase.from("firm_services").select("*"),
    supabase.from("firm_payments").select("*").order("payment_date", { ascending: false }),
  ])
  if (firmsRes.error) fail("Firmalar alınamadı", firmsRes.error)
  if (servicesRes.error) fail("Firma hizmetleri alınamadı", servicesRes.error)
  if (paymentsRes.error) fail("Ödemeler alınamadı", paymentsRes.error)

  const services = withNumericPrice((servicesRes.data ?? []) as FirmService[])
  const payments = withNumericAmount((paymentsRes.data ?? []) as FirmPayment[])

  return ((firmsRes.data ?? []) as BillingFirm["firm"][])
    .map((firm) => ({
      firm,
      services: services.filter((s) => s.firm_id === firm.id),
      payments: payments.filter((p) => p.firm_id === firm.id),
    }))
    .sort((a, b) => a.firm.name.localeCompare(b.firm.name, "tr"))
}
