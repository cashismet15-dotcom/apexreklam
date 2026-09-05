"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getSessionRole } from "@/lib/auth-role"
import { addDaysIso, todayIso } from "@/lib/daily-tracker"
import {
  PLACEHOLDER_MONTHLY_FEE,
  PLACEHOLDER_PAYMENT_DAY,
  canManageCustomers,
  localDateTimeToIso,
  toTeamRole,
} from "@/lib/panel"
import { supabase } from "@/lib/supabase"
import type { ActionState } from "@/lib/actions/shared"
import type { AiBugStatus, ClientTaskStatus, TeamMemberRole } from "@/lib/types"

function revalidatePanel(customerId?: string | null) {
  revalidatePath("/panel")
  if (customerId) revalidatePath(`/panel/${customerId}`)
  // Aynı customers tablosu — Muhasebe tarafı da güncel kalsın.
  revalidatePath("/muhasebe/musteriler")
  revalidatePath("/muhasebe")
}

async function requireTeamRole(): Promise<TeamMemberRole> {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) throw new Error("Yetkisiz.")
  return role
}

/** Bir taskId'den customer_id'sini bulup ilgili Panel sayfalarını revalidate eder. */
async function revalidateForTask(taskId: string) {
  const { data: task } = await supabase
    .from("client_tasks")
    .select("customer_id")
    .eq("id", taskId)
    .maybeSingle()
  revalidatePanel(task?.customer_id)
}

async function requireCustomerManager(): Promise<TeamMemberRole> {
  const role = await requireTeamRole()
  if (!canManageCustomers(role)) throw new Error("Yetkisiz.")
  return role
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  category: z.enum(["video", "reklam", "yapay_zeka", "diger"]),
  assigned_to: z.enum(["owner", "huseyin", "batuhan"]),
  // Son tarihi doğrudan seçtirmek yerine "kaç gün süre veriliyor" diye soruyoruz —
  // due_date bugünün tarihine bu kadar gün eklenerek hesaplanır.
  duration_days: z.coerce.number().int().min(0).optional(),
})

/** customerId null ise genel/dahili bir görev oluşturur — belirli bir müşteriye bağlı değil. */
export async function createClientTask(
  customerId: string | null,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const role = await requireTeamRole()

  const durationRaw = formData.get("duration_days")
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    assigned_to: formData.get("assigned_to"),
    duration_days: durationRaw ? durationRaw : undefined,
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const dueDate =
    parsed.data.duration_days !== undefined ? addDaysIso(todayIso(), parsed.data.duration_days) : null

  const { error } = await supabase.from("client_tasks").insert({
    customer_id: customerId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    category: parsed.data.category,
    assigned_to: parsed.data.assigned_to,
    created_by: role,
    due_date: dueDate,
  })

  if (error) {
    return { status: "error", message: `Görev eklenemedi: ${error.message}` }
  }

  revalidatePanel(customerId)
  return { status: "success", message: "Görev eklendi." }
}

export async function updateTaskStatus(
  taskId: string,
  status: ClientTaskStatus
): Promise<ActionState> {
  await requireTeamRole()

  const { data, error } = await supabase
    .from("client_tasks")
    .update({ status, completed_at: status === "tamamlandi" ? new Date().toISOString() : null })
    .eq("id", taskId)
    .select("customer_id")
    .single()

  if (error) {
    return { status: "error", message: `Güncellenemedi: ${error.message}` }
  }

  revalidatePanel(data?.customer_id)
  return { status: "success" }
}

export async function deleteClientTask(taskId: string): Promise<ActionState> {
  await requireTeamRole()

  const { data, error } = await supabase
    .from("client_tasks")
    .delete()
    .eq("id", taskId)
    .select("customer_id")
    .single()

  if (error) {
    return { status: "error", message: `Görev silinemedi: ${error.message}` }
  }

  revalidatePanel(data?.customer_id)
  return { status: "success", message: "Görev silindi." }
}

const adReportSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Geçerli bir ay seçin"),
  spend: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
})

export async function upsertAdReport(
  customerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeamRole()

  const parsed = adReportSchema.safeParse({
    period: formData.get("period"),
    spend: formData.get("spend"),
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  let spendValue: number | null = null
  if (parsed.data.spend) {
    spendValue = Number(parsed.data.spend)
    if (Number.isNaN(spendValue)) {
      return { status: "error", message: "Harcama sayısal olmalı." }
    }
  }

  const { error } = await supabase.from("client_ad_reports").upsert(
    {
      customer_id: customerId,
      period: `${parsed.data.period}-01`,
      spend: spendValue,
      note: parsed.data.note || null,
    },
    { onConflict: "customer_id,period" }
  )

  if (error) {
    return { status: "error", message: `Kaydedilemedi: ${error.message}` }
  }

  revalidatePanel(customerId)
  return { status: "success", message: "Rapor kaydedildi." }
}

export async function deleteAdReport(id: string): Promise<ActionState> {
  await requireTeamRole()

  const { data, error } = await supabase
    .from("client_ad_reports")
    .delete()
    .eq("id", id)
    .select("customer_id")
    .single()

  if (error) {
    return { status: "error", message: `Rapor silinemedi: ${error.message}` }
  }

  revalidatePanel(data?.customer_id)
  return { status: "success", message: "Rapor silindi." }
}

const customerInfoSchema = z.object({
  company_name: z.string().trim().min(1, "Firma adı zorunlu").max(200),
  contact_name: z.string().trim().min(1, "Yetkili zorunlu").max(200),
  phone: z.string().trim().min(1, "Telefon zorunlu").max(40),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

function parseCustomerInfoForm(formData: FormData) {
  return customerInfoSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  })
}

// Hızlı ekleme formu: elimizdeki ham veriyi (isim bilinmese bile) hızlıca
// girebilmek için — sadece telefon zorunlu. İsim boşsa görünen ad olarak
// telefon numarası kullanılır, sonradan düzenlenebilir.
const quickCustomerSchema = z.object({
  name: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Telefon zorunlu").max(40),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

/**
 * Panel'den yeni müşteri ekler — sadece isim (opsiyonel), telefon (zorunlu)
 * ve not ile, hızlıca. Aylık ücret/ödeme günü ekip tarafından görülmüyor,
 * dolayısıyla girilemiyor — yer tutucu ücretle (₺1) kaydedilir, patron
 * Muhasebe'den gerçek tutarı girip tamamlamalı (Panel'deki "Ücret
 * Ayarlanmadı" rozeti bunu hatırlatır).
 */
export async function createPanelCustomer(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireCustomerManager()

  const parsed = quickCustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const displayName = parsed.data.name || parsed.data.phone

  const { error } = await supabase.from("customers").insert({
    company_name: displayName,
    contact_name: displayName,
    phone: parsed.data.phone,
    notes: parsed.data.notes || null,
    monthly_fee: PLACEHOLDER_MONTHLY_FEE,
    payment_day: PLACEHOLDER_PAYMENT_DAY,
    status: "aktif",
  })

  if (error) {
    return { status: "error", message: `Müşteri eklenemedi: ${error.message}` }
  }

  revalidatePanel()
  return { status: "success", message: "Müşteri eklendi." }
}

/** Panel'den müşterinin şirket/iletişim bilgilerini günceller — ücret/ödeme günü/durum bu forma dahil değil. */
export async function updatePanelCustomerInfo(
  customerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireCustomerManager()

  const parsed = parseCustomerInfoForm(formData)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase
    .from("customers")
    .update({
      company_name: parsed.data.company_name,
      contact_name: parsed.data.contact_name,
      phone: parsed.data.phone,
      notes: parsed.data.notes || null,
    })
    .eq("id", customerId)

  if (error) {
    return { status: "error", message: `Müşteri güncellenemedi: ${error.message}` }
  }

  revalidatePanel(customerId)
  return { status: "success", message: "Müşteri güncellendi." }
}

const ATTACHMENTS_BUCKET = "documents"
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]+/g, "_")
}

/** Göreve küçük bir dosya (sunum, PDF vb.) yükler — büyük videolar için addTaskLink kullanılmalı. */
export async function uploadTaskAttachment(
  taskId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeamRole()

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Bir dosya seçin." }
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) {
    return { status: "error", message: "Sadece PDF yüklenebilir." }
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      status: "error",
      message: "Dosya 25MB'tan büyük olamaz — büyük videolar için Google Drive linki ekle.",
    }
  }

  const path = `tasks/${taskId}/${Date.now()}-${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined })

  if (uploadError) {
    return { status: "error", message: `Dosya yüklenemedi: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path)

  const { error: insertError } = await supabase.from("client_task_attachments").insert({
    task_id: taskId,
    kind: "dosya",
    label: file.name,
    url: publicUrlData.publicUrl,
    file_path: path,
    file_size: file.size,
  })

  if (insertError) {
    return { status: "error", message: `Kaydedilemedi: ${insertError.message}` }
  }

  await revalidateForTask(taskId)
  return { status: "success", message: "Dosya eklendi." }
}

const linkSchema = z.object({
  label: z.string().trim().max(200).optional().or(z.literal("")),
  url: z.string().trim().url("Geçerli bir link girin"),
})

/** Göreve harici bir link ekler (Google Drive, YouTube vb.) — büyük dosyalar için önerilen yöntem. */
export async function addTaskLink(
  taskId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeamRole()

  const parsed = linkSchema.safeParse({
    label: formData.get("label"),
    url: formData.get("url"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("client_task_attachments").insert({
    task_id: taskId,
    kind: "link",
    label: parsed.data.label || parsed.data.url,
    url: parsed.data.url,
  })

  if (error) {
    return { status: "error", message: `Link eklenemedi: ${error.message}` }
  }

  await revalidateForTask(taskId)
  return { status: "success", message: "Link eklendi." }
}

export async function deleteTaskAttachment(attachmentId: string): Promise<ActionState> {
  await requireTeamRole()

  const { data: attachment, error: fetchError } = await supabase
    .from("client_task_attachments")
    .select("kind, file_path, task_id")
    .eq("id", attachmentId)
    .maybeSingle()

  if (fetchError || !attachment) {
    return { status: "error", message: "Ek bulunamadı." }
  }

  if (attachment.kind === "dosya" && attachment.file_path) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([attachment.file_path])
  }

  const { error } = await supabase
    .from("client_task_attachments")
    .delete()
    .eq("id", attachmentId)

  if (error) {
    return { status: "error", message: `Ek silinemedi: ${error.message}` }
  }

  await revalidateForTask(attachment.task_id)
  return { status: "success", message: "Ek silindi." }
}

function revalidateAfterQuickAdd(customerId: string, listPath: string) {
  revalidatePanel(customerId)
  revalidatePath(listPath)
}

const quickLinkSchema = z.object({
  customer_id: z.string().trim().min(1, "Şirket seçin"),
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  url: z.string().trim().url("Geçerli bir link girin"),
})

/** Video Montajları sayfasından tek adımda: şirket + başlık + Drive linki. */
export async function quickAddVideoLink(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const role = await requireTeamRole()

  const parsed = quickLinkSchema.safeParse({
    customer_id: formData.get("customer_id"),
    title: formData.get("title"),
    url: formData.get("url"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { data: task, error: taskError } = await supabase
    .from("client_tasks")
    .insert({
      customer_id: parsed.data.customer_id,
      title: parsed.data.title,
      category: "video",
      status: "tamamlandi",
      assigned_to: role,
      created_by: role,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (taskError || !task) {
    return { status: "error", message: `Görev oluşturulamadı: ${taskError?.message ?? ""}` }
  }

  const { error } = await supabase.from("client_task_attachments").insert({
    task_id: task.id,
    kind: "link",
    label: parsed.data.title,
    url: parsed.data.url,
  })

  if (error) {
    return { status: "error", message: `Link eklenemedi: ${error.message}` }
  }

  revalidateAfterQuickAdd(parsed.data.customer_id, "/panel/videolar")
  return { status: "success", message: "Video linki eklendi." }
}

function revalidateBugs() {
  revalidatePath("/panel/hatalar")
}

const bugSchema = z.object({
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  severity: z.enum(["kritik", "orta", "dusuk"]),
  customer_id: z.string().trim().optional().or(z.literal("")),
})

export async function createAiBug(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const role = await requireTeamRole()

  const parsed = bugSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    customer_id: formData.get("customer_id"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  let imagePath: string | null = null
  let imageUrl: string | null = null

  const image = formData.get("image")
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      return { status: "error", message: "Sadece görsel dosyası yüklenebilir." }
    }
    if (image.size > MAX_ATTACHMENT_BYTES) {
      return { status: "error", message: "Görsel 25MB'tan büyük olamaz." }
    }

    const path = `bugs/${Date.now()}-${sanitizeFileName(image.name)}`
    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, image, { contentType: image.type || undefined })

    if (uploadError) {
      return { status: "error", message: `Görsel yüklenemedi: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path)
    imagePath = path
    imageUrl = publicUrlData.publicUrl
  }

  const { error } = await supabase.from("ai_bugs").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    severity: parsed.data.severity,
    created_by: role,
    customer_id:
      parsed.data.customer_id && parsed.data.customer_id !== "genel" ? parsed.data.customer_id : null,
    image_path: imagePath,
    image_url: imageUrl,
  })

  if (error) {
    return { status: "error", message: `Hata eklenemedi: ${error.message}` }
  }

  revalidateBugs()
  return { status: "success", message: "Hata eklendi." }
}

export async function updateBugStatus(bugId: string, status: AiBugStatus): Promise<ActionState> {
  await requireTeamRole()

  const { error } = await supabase
    .from("ai_bugs")
    .update({ status, resolved_at: status === "cozuldu" ? new Date().toISOString() : null })
    .eq("id", bugId)

  if (error) {
    return { status: "error", message: `Güncellenemedi: ${error.message}` }
  }

  revalidateBugs()
  return { status: "success" }
}

export async function deleteAiBug(bugId: string): Promise<ActionState> {
  await requireTeamRole()

  const { data: bug } = await supabase
    .from("ai_bugs")
    .select("image_path")
    .eq("id", bugId)
    .maybeSingle()

  if (bug?.image_path) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([bug.image_path])
  }

  const { error } = await supabase.from("ai_bugs").delete().eq("id", bugId)
  if (error) {
    return { status: "error", message: `Hata kaydı silinemedi: ${error.message}` }
  }

  revalidateBugs()
  return { status: "success", message: "Hata kaydı silindi." }
}

function revalidateNotes() {
  revalidatePath("/panel/notlar")
  // Genel notlar dashboard'da da gösteriliyor.
  revalidatePath("/panel")
}

const noteSchema = z.object({
  body: z.string().trim().min(1, "Not boş olamaz").max(4000),
})

/** isPrivate true ise sadece yazan görür; false ise herkes görür (dashboard'daki Genel Notlar dahil). */
export async function addPanelNote(
  isPrivate: boolean,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const role = await requireTeamRole()

  const parsed = noteSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("panel_notes").insert({
    author: role,
    body: parsed.data.body,
    is_private: isPrivate,
  })

  if (error) {
    return { status: "error", message: `Not eklenemedi: ${error.message}` }
  }

  revalidateNotes()
  return { status: "success", message: "Not eklendi." }
}

export async function deletePanelNote(noteId: string): Promise<ActionState> {
  await requireTeamRole()

  const { error } = await supabase.from("panel_notes").delete().eq("id", noteId)
  if (error) {
    return { status: "error", message: `Not silinemedi: ${error.message}` }
  }

  revalidateNotes()
  return { status: "success", message: "Not silindi." }
}

function revalidateMeetings() {
  revalidatePath("/panel")
  revalidatePath("/panel/toplantilar")
}

const meetingSchema = z.object({
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  meeting_at: z.string().trim().min(1, "Tarih/saat gerekli"),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  link: z.string().trim().max(500).optional().or(z.literal("")),
  participants: z
    .array(z.enum(["owner", "huseyin", "batuhan"]))
    .min(1, "En az bir katılımcı seç"),
})

export async function createMeeting(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const role = await requireTeamRole()

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    meeting_at: formData.get("meeting_at"),
    note: formData.get("note"),
    link: formData.get("link"),
    participants: formData.getAll("participants"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const meetingAtIso = localDateTimeToIso(parsed.data.meeting_at)
  if (!meetingAtIso) {
    return { status: "error", message: "Geçerli bir tarih/saat girin." }
  }

  const { error } = await supabase.from("panel_meetings").insert({
    title: parsed.data.title,
    meeting_at: meetingAtIso,
    note: parsed.data.note || null,
    link: parsed.data.link || null,
    participants: parsed.data.participants,
    created_by: role,
  })

  if (error) {
    return { status: "error", message: `Toplantı eklenemedi: ${error.message}` }
  }

  revalidateMeetings()
  return { status: "success", message: "Toplantı eklendi." }
}

export async function deleteMeeting(meetingId: string): Promise<ActionState> {
  await requireTeamRole()

  const { error } = await supabase.from("panel_meetings").delete().eq("id", meetingId)
  if (error) {
    return { status: "error", message: `Toplantı silinemedi: ${error.message}` }
  }

  revalidateMeetings()
  return { status: "success", message: "Toplantı silindi." }
}

const messageSchema = z.object({
  body: z.string().trim().min(1, "Mesaj boş olamaz").max(1000),
})

export async function sendPanelMessage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const role = await requireTeamRole()

  const parsed = messageSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("panel_messages").insert({
    author: role,
    body: parsed.data.body,
  })

  if (error) {
    return { status: "error", message: `Mesaj gönderilemedi: ${error.message}` }
  }

  // Sohbet widget'ı panel/layout.tsx'te fetch ediliyor — "layout" tipiyle
  // revalidate edilmezse, o segment yeniden render edilmez ve mesaj görünmez.
  revalidatePath("/panel", "layout")
  return { status: "success" }
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

/** Her ekip üyesi sadece kendi profil resmini değiştirebilir — session role'ünden alınır. */
export async function uploadAvatar(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const role = await requireTeamRole()

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Bir görsel seçin." }
  }
  if (!file.type.startsWith("image/")) {
    return { status: "error", message: "Sadece görsel dosyası yüklenebilir." }
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { status: "error", message: "Görsel 5MB'tan büyük olamaz." }
  }

  const { data: existing } = await supabase
    .from("team_avatars")
    .select("avatar_path")
    .eq("role", role)
    .maybeSingle()

  if (existing?.avatar_path) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([existing.avatar_path])
  }

  const ext = sanitizeFileName(file.name).split(".").pop() || "png"
  const path = `avatars/${role}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { status: "error", message: `Yüklenemedi: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path)

  const { error } = await supabase.from("team_avatars").upsert(
    {
      role,
      avatar_path: path,
      avatar_url: publicUrlData.publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "role" }
  )

  if (error) {
    return { status: "error", message: `Kaydedilemedi: ${error.message}` }
  }

  revalidatePath("/panel", "layout")
  return { status: "success", message: "Profil resmi güncellendi." }
}

function revalidateLeads() {
  revalidatePath("/panel/potansiyel-musteriler")
}

const leadSchema = z.object({
  name: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Telefon zorunlu").max(40),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
})

/** Potansiyel Müşteriler'e hızlı ekleme — sadece telefon zorunlu, isim/not opsiyonel. */
export async function createLead(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const role = await requireCustomerManager()

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: "Formda hatalar var.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { error } = await supabase.from("panel_leads").insert({
    name: parsed.data.name || null,
    phone: parsed.data.phone,
    note: parsed.data.note || null,
    created_by: role,
  })

  if (error) {
    return { status: "error", message: `Eklenemedi: ${error.message}` }
  }

  revalidateLeads()
  return { status: "success", message: "Potansiyel müşteri eklendi." }
}

export async function deleteLead(leadId: string): Promise<ActionState> {
  await requireCustomerManager()

  const { error } = await supabase.from("panel_leads").delete().eq("id", leadId)
  if (error) {
    return { status: "error", message: `Silinemedi: ${error.message}` }
  }

  revalidateLeads()
  return { status: "success", message: "Silindi." }
}

/** Bir adayı gerçek müşteriye (Şirketler) dönüştürür — ücret/ödeme günü yer tutucuyla, sonra Muhasebe'den tamamlanır. */
export async function convertLeadToCustomer(leadId: string): Promise<ActionState> {
  await requireCustomerManager()

  const { data: lead, error: fetchError } = await supabase
    .from("panel_leads")
    .select("name, phone, note")
    .eq("id", leadId)
    .maybeSingle()

  if (fetchError || !lead) {
    return { status: "error", message: "Aday bulunamadı." }
  }

  const displayName = lead.name || lead.phone

  const { error: insertError } = await supabase.from("customers").insert({
    company_name: displayName,
    contact_name: displayName,
    phone: lead.phone,
    notes: lead.note,
    monthly_fee: PLACEHOLDER_MONTHLY_FEE,
    payment_day: PLACEHOLDER_PAYMENT_DAY,
    status: "aktif",
  })

  if (insertError) {
    return { status: "error", message: `Müşteriye dönüştürülemedi: ${insertError.message}` }
  }

  const { error: deleteError } = await supabase.from("panel_leads").delete().eq("id", leadId)
  if (deleteError) {
    return { status: "error", message: `Aday listeden silinemedi: ${deleteError.message}` }
  }

  revalidateLeads()
  revalidatePanel()
  return { status: "success", message: "Müşteriye dönüştürüldü — Şirketler'de görünüyor." }
}
