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

/** Panel modülü içindeki Sunumlar (ve genel dosya deposu): yüklenen bir dosya. */
export interface DocumentFile {
  id: string
  name: string
  file_path: string
  file_url: string
  file_type: string | null
  file_size: number
  note: string | null
  created_at: string
}

/** Panel modülü: gerçek bir kullanıcılar tablosu yok, ekip kimliği session role'üyle birebir eşleşir. */
export type TeamMemberRole = "owner" | "huseyin" | "batuhan"

/** Panel modülü: her rolün kendi yükleyebileceği profil resmi. */
export interface TeamAvatar {
  role: TeamMemberRole
  avatar_path: string | null
  avatar_url: string | null
  updated_at: string
}

export type ClientTaskCategory = "video" | "reklam" | "yapay_zeka" | "diger"
export type ClientTaskStatus = "bekliyor" | "devam_ediyor" | "tamamlandi"

/** Panel modülü: bir müşteri için yapılan/yapılacak, birine atanan iş. Boşsa genel/dahili bir görev. */
export interface ClientTask {
  id: string
  customer_id: string | null
  title: string
  description: string | null
  category: ClientTaskCategory
  status: ClientTaskStatus
  assigned_to: TeamMemberRole
  created_by: TeamMemberRole
  due_date: string | null
  completed_at: string | null
  created_at: string
}

export interface ClientTaskWithCustomer extends ClientTask {
  customer: Pick<Customer, "id" | "company_name"> | null
}

export type TaskAttachmentKind = "dosya" | "link"

/** Panel modülü: bir göreve eklenen dosya (Storage'a yüklenen) veya link (örn. Google Drive video). */
export interface ClientTaskAttachment {
  id: string
  task_id: string
  kind: TaskAttachmentKind
  label: string
  url: string
  /** Sadece kind === "dosya" için dolu — Storage'dan silmek için gerekli. */
  file_path: string | null
  file_size: number | null
  created_at: string
}

export interface ClientTaskWithAttachments extends ClientTask {
  attachments: ClientTaskAttachment[]
}

export type AiBugSeverity = "kritik" | "orta" | "dusuk"
export type AiBugStatus = "acik" | "inceleniyor" | "cozuldu"

/** Panel modülü: Hata Takibi — bir müşterinin YZ sistemindeki (veya genel) bir hata kaydı. */
export interface AiBug {
  id: string
  /** Boşsa genel/dahili bir hata — belirli bir müşteriye bağlı değil. */
  customer_id: string | null
  title: string
  description: string | null
  severity: AiBugSeverity
  status: AiBugStatus
  assigned_to: TeamMemberRole | null
  created_by: TeamMemberRole
  /** Ekran görüntüsü — Storage'dan silmek için gerekli. */
  image_path: string | null
  image_url: string | null
  resolved_at: string | null
  created_at: string
}

export interface AiBugWithCustomer extends AiBug {
  customer: Pick<Customer, "id" | "company_name"> | null
}

/** Panel modülü: Notlar — genel (herkes görür) veya kişisel (sadece yazan görür), tarihe göre gruplanır. */
export interface PanelNote {
  id: string
  author: TeamMemberRole
  body: string
  is_private: boolean
  created_at: string
}

/** Panel modülü: Toplantılar — basit kayıt, gerçek video görüşmesi burada olmaz. */
export interface PanelMeeting {
  id: string
  title: string
  meeting_at: string
  note: string | null
  link: string | null
  participants: TeamMemberRole[]
  created_by: TeamMemberRole
  created_at: string
}

/** Panel modülü: Sohbet — tek kanallı, paylaşımlı ekip mesajlaşması. */
export interface PanelMessage {
  id: string
  author: TeamMemberRole
  body: string
  created_at: string
}

/** Panel modülü: Potansiyel Müşteriler — henüz Şirketler'e dönüşmemiş adaylar. */
export interface PanelLead {
  id: string
  name: string | null
  phone: string
  note: string | null
  created_by: TeamMemberRole
  created_at: string
}

/** Panel modülü: bir müşterinin ayı için Meta reklam rakamları (manuel girilir). */
export interface ClientAdReport {
  id: string
  customer_id: string
  /** O ayın 1'i, ISO tarih. */
  period: string
  spend: number | null
  note: string | null
  created_at: string
}

export interface ClientAdReportWithCustomer extends ClientAdReport {
  customer: Pick<Customer, "id" | "company_name">
}

/** Panel modülü: Sunumlar/Video Montajları sayfaları — ekin hangi görev/müşteriden geldiği. */
export interface AttachmentWithContext extends ClientTaskAttachment {
  taskId: string
  taskTitle: string
  /** Görev genel/dahili ise (bir müşteriye bağlı değilse) null. */
  customerId: string | null
  customerName: string
}

/** Panel modülü: dashboard/profil'deki motivasyon istatistikleri (görevlerim özeti). */
export interface TaskStats {
  completedThisWeek: number
  completedThisMonth: number
  completedTotal: number
  openCount: number
  overdueCount: number
  byCategory: Record<ClientTaskCategory, number>
}
