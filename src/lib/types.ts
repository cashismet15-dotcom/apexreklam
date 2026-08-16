export type CustomerStatus = "aktif" | "pasif" | "donduruldu"

export interface Customer {
  id: string
  company_name: string
  contact_name: string
  phone: string
  monthly_fee: number
  payment_day: number
  status: CustomerStatus
  start_date: string
  notes: string | null
  created_at: string
  /** Aktif dondurmanın başladığı tarih; donduruldu değilse null. */
  frozen_since: string | null
  /** Bugüne kadar biriken toplam dondurma günü; ödeme vadeleri bu kadar ileri kayar. */
  freeze_offset_days: number
  /** Danışan İçerik Takibi: logo URL'i. */
  logo_url: string | null
  /** Danışan İçerik Takibi: kalıcı video talimatları/notları (haftalık değil). */
  content_notes: string | null
}

export type ContentStatus = "talimat_bekliyor" | "hazirlaniyor" | "onayda" | "yayinlandi"

export interface ContentWeek {
  id: string
  customer_id: string
  week_start: string
  status: ContentStatus
  note: string | null
  video_url: string | null
  created_at: string
}

export interface Payment {
  id: string
  customer_id: string
  amount: number
  payment_date: string
  month: number
  year: number
  note: string | null
  expected_remaining_date: string | null
  created_at: string
}

export interface PaymentWithCustomer extends Payment {
  customer: Pick<Customer, "id" | "company_name" | "contact_name">
}

export type MessageDirection = "gelen" | "giden"

export interface CrmContact {
  id: string
  phone: string
  name: string | null
  city: string | null
  notes: string | null
  last_message_at: string | null
  created_at: string
}

export interface CrmContactNote {
  id: string
  contact_id: string
  body: string
  created_at: string
}

export interface CrmMessage {
  id: string
  contact_id: string
  direction: MessageDirection
  body: string
  whatsapp_message_id: string | null
  created_at: string
}

export interface CrmQuickReply {
  id: string
  title: string
  message: string
  sort_order: number
  created_at: string
}

export interface DailyHabit {
  id: string
  title: string
  sort_order: number
  active: boolean
  created_at: string
}

export interface DailyHabitLog {
  id: string
  habit_id: string
  log_date: string
  done: boolean
  created_at: string
}

export type UfoJobCategory = "ev_temizligi" | "koltuk_yikama"
export type UfoCleaningType = "dolu_ev" | "kiraci_sonrasi" | "insaat_sonrasi"
export type UfoHomeType = "1+1" | "2+1" | "3+1" | "4+1" | "5+1"
export type UfoJobStatus = "bekliyor" | "tamamlandi" | "iptal"
export type UfoRecordType = "randevu" | "is"

export interface UfoJob {
  id: string
  record_type: UfoRecordType
  category: UfoJobCategory
  cleaning_type: UfoCleaningType | null
  home_type: UfoHomeType | null
  location: string | null
  customer_name: string | null
  customer_phone: string | null
  amount: number
  commission_amount: number
  job_date: string | null
  job_time: string | null
  status: UfoJobStatus
  note: string | null
  open_to_partners: boolean
  taken_by_partner_id: string | null
  partner_taken_at: string | null
  partner_rating: number | null
  partner_terms_version: string | null
  created_at: string
  /** Sadece owner/ufo tarafındaki join'li sorgularda dolu gelir. */
  taken_by_partner?: { name: string } | null
}

export interface PartnerCompany {
  id: string
  name: string
  username: string
  active: boolean
  tax_id: string | null
  tax_office: string | null
  address: string | null
  contact_name: string | null
  contact_phone: string | null
  tax_document_url: string | null
  balance: number
  created_at: string
  /** Sadece getPartnerCompanies() (admin listesi) tarafından hesaplanır. */
  avg_rating?: number | null
  rating_count?: number
}

export type PartnerTransactionType = "topup" | "commission" | "adjustment"
export type PartnerTransactionStatus = "pending" | "completed" | "failed"

export interface PartnerTransaction {
  id: string
  company_id: string
  type: PartnerTransactionType
  amount: number
  job_id: string | null
  status: PartnerTransactionStatus
  note: string | null
  created_at: string
}

/** Taşeron havuzunda gösterilecek iş — hassas alanlar (müşteri, komisyon) hiç yok. */
export interface PartnerJob {
  id: string
  category: UfoJobCategory
  cleaning_type: UfoCleaningType | null
  home_type: UfoHomeType | null
  location: string | null
  job_date: string | null
  job_time: string | null
  amount: number
  taken_by_partner_id: string | null
}

export type YakamozJobStatus = "siparis_alindi" | "yikamada" | "bitti" | "yolda"

export interface YakamozJob {
  id: string
  customer_name: string | null
  phone: string
  address_text: string | null
  lat: number | null
  lng: number | null
  il: string
  ilce: string
  mahalle: string | null
  price_per_m2: number | null
  requested_date: string | null
  requested_time: string | null
  status: YakamozJobStatus
  status_changed_at: string
  note: string | null
  created_at: string
}

export interface YakamozStatusLog {
  id: string
  job_id: string
  status: YakamozJobStatus
  changed_at: string
}

export interface YakamozContact {
  id: string
  phone: string
  name: string | null
  ai_paused: boolean
  last_message_at: string | null
  created_at: string
}

export type YakamozWaDirection = "gelen" | "giden"

export interface YakamozWaMessage {
  id: string
  contact_id: string
  direction: YakamozWaDirection
  body: string
  external_message_id: string | null
  created_at: string
}

export interface YakamozCustomerSummary {
  phone: string
  customer_name: string | null
  lastServiceDate: string | null
  totalJobs: number
  needsReminder: boolean
}

export interface YakamozTemplate {
  id: string
  title: string
  body: string
  created_at: string
}

export interface YakamozSpecialDay {
  id: string
  title: string
  month: number
  day: number
  template_id: string | null
  body: string | null
  last_sent_year: number | null
  created_at: string
}

export interface YakamozBroadcast {
  id: string
  title: string | null
  body: string
  recipient_count: number
  success_count: number
  failed_count: number
  created_at: string
}

export interface YakamozRecipient {
  phone: string
  name: string | null
}
