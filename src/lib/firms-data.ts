import "server-only"

import { supabase } from "@/lib/supabase"
import type {
  Customer,
  Firm,
  FirmNote,
  FirmService,
  FirmServiceWithFirm,
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

/** Firmaya bağlı Muhasebe kaydı (olumlu olduysa). */
export async function getCustomerForFirm(firmId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) fail("Muhasebe kaydı alınamadı", error)
  return data ? ({ ...data, monthly_fee: Number(data.monthly_fee) } as Customer) : null
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

/** Vadesi verilen aralıkta olan tek seferlik hizmetler (takvim için). */
export async function getOneTimeServicesBetween(
  fromIso: string,
  toIso: string
): Promise<FirmServiceWithFirm[]> {
  const { data, error } = await supabase
    .from("firm_services")
    .select("*, firm:firms(id, name)")
    .eq("billing", "tek_seferlik")
    .gte("due_date", fromIso)
    .lte("due_date", toIso)
    .order("due_date", { ascending: true })
  if (error) fail("Tek seferlik hizmetler alınamadı", error)
  return withNumericPrice((data ?? []) as FirmServiceWithFirm[])
}

/** Tahsil edilmemiş tüm tek seferlik hizmetler (takvimdeki bekleyenler listesi için). */
export async function getUnpaidOneTimeServices(): Promise<FirmServiceWithFirm[]> {
  const { data, error } = await supabase
    .from("firm_services")
    .select("*, firm:firms(id, name)")
    .eq("billing", "tek_seferlik")
    .is("paid_at", null)
    .order("due_date", { ascending: true })
  if (error) fail("Tek seferlik hizmetler alınamadı", error)
  return withNumericPrice((data ?? []) as FirmServiceWithFirm[])
}
