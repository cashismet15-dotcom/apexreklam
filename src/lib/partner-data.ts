import "server-only"

import { supabase } from "@/lib/supabase"
import type { PartnerCompany, PartnerJob, PartnerTransaction } from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

/**
 * Taşeron firmaların gördüğü iş havuzu. Sadece izin verilen kolonlar seçilir —
 * customer_name/customer_phone/commission_amount/note buraya asla dahil edilmez.
 */
export async function getPartnerJobs(): Promise<PartnerJob[]> {
  const { data, error } = await supabase
    .from("ufo_jobs")
    .select("id, category, cleaning_type, home_type, location, job_date, job_time, amount, taken_by_partner_id")
    .eq("open_to_partners", true)
    .eq("record_type", "is")
    .eq("status", "bekliyor")
    .order("job_date", { ascending: true, nullsFirst: false })

  if (error) fail("İş havuzu alınamadı", error)
  return data
}

export async function getPartnerCompanies(): Promise<PartnerCompany[]> {
  const [{ data: companies, error: companiesError }, { data: ratings, error: ratingsError }] =
    await Promise.all([
      supabase
        .from("partner_companies")
        .select(
          "id, name, username, active, tax_id, tax_office, address, contact_name, contact_phone, tax_document_url, balance, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("ufo_jobs")
        .select("taken_by_partner_id, partner_rating")
        .not("taken_by_partner_id", "is", null)
        .not("partner_rating", "is", null),
    ])

  if (companiesError) fail("Taşeron firmalar alınamadı", companiesError)
  if (ratingsError) fail("Puanlar alınamadı", ratingsError)

  const ratingsByCompany = new Map<string, number[]>()
  for (const row of ratings) {
    if (!row.taken_by_partner_id || row.partner_rating == null) continue
    const list = ratingsByCompany.get(row.taken_by_partner_id) ?? []
    list.push(row.partner_rating)
    ratingsByCompany.set(row.taken_by_partner_id, list)
  }

  return companies.map((company) => {
    const list = ratingsByCompany.get(company.id)
    const avg_rating = list?.length ? list.reduce((acc, n) => acc + n, 0) / list.length : null
    return { ...company, avg_rating, rating_count: list?.length ?? 0 }
  })
}

/** Taşeron firmanın kendi profil sayfası için — tüm profil kolonlarını seçer. */
export async function getPartnerCompanyById(id: string): Promise<PartnerCompany | null> {
  const { data, error } = await supabase
    .from("partner_companies")
    .select(
      "id, name, username, active, tax_id, tax_office, address, contact_name, contact_phone, tax_document_url, balance, created_at"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) fail("Firma profili alınamadı", error)
  return data
}

export async function getPartnerTransactions(companyId: string, limit = 20): Promise<PartnerTransaction[]> {
  const { data, error } = await supabase
    .from("partner_transactions")
    .select("id, company_id, type, amount, job_id, status, note, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) fail("İşlem geçmişi alınamadı", error)
  return data
}
