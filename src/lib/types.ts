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
  notes: string | null
  last_message_at: string | null
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
