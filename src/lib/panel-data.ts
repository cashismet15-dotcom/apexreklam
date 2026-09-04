import "server-only"

import { computeCollectionStatuses, type CustomerCollectionStatus } from "@/lib/collections"
import { todayIso } from "@/lib/daily-tracker"
import { sortBugs } from "@/lib/panel"
import { supabase } from "@/lib/supabase"
import type {
  AiBugWithCustomer,
  AttachmentWithContext,
  ClientAdReport,
  ClientAdReportWithCustomer,
  ClientTaskAttachment,
  ClientTaskCategory,
  ClientTaskWithAttachments,
  ClientTaskWithCustomer,
  Customer,
  Payment,
  PanelNote,
  TaskAttachmentKind,
  TaskStats,
  TeamMemberRole,
} from "@/lib/types"

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`)
}

/** Panel'de gösterilecek müşteri kartları: aktif müşteriler + bu ayki ödeme durumu. */
export async function getPanelCustomerStatuses(): Promise<CustomerCollectionStatus[]> {
  const [{ data: customers, error: customersError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase.from("customers").select("*").order("company_name", { ascending: true }),
      supabase.from("payments").select("*"),
    ])

  if (customersError) fail("Müşteriler alınamadı", customersError)
  if (paymentsError) fail("Ödemeler alınamadı", paymentsError)

  return computeCollectionStatuses((customers ?? []) as Customer[], (payments ?? []) as Payment[])
}

export async function getPanelCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle()
  if (error) fail("Müşteri alınamadı", error)
  return data
}

/** Bir müşterinin görevleri (ekleri dahil); viewerRole owner değilse sadece kendisine atananlar döner. */
export async function getClientTasks(
  customerId: string,
  viewerRole: TeamMemberRole
): Promise<ClientTaskWithAttachments[]> {
  let query = supabase
    .from("client_tasks")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })

  if (viewerRole !== "owner") {
    query = query.eq("assigned_to", viewerRole)
  }

  const { data: tasks, error } = await query
  if (error) fail("Görevler alınamadı", error)
  if (!tasks || tasks.length === 0) return []

  const taskIds = tasks.map((t) => t.id)
  const { data: attachments, error: attachmentsError } = await supabase
    .from("client_task_attachments")
    .select("*")
    .in("task_id", taskIds)
    .order("created_at", { ascending: true })

  if (attachmentsError) fail("Ekler alınamadı", attachmentsError)

  const attachmentsByTask = new Map<string, ClientTaskAttachment[]>()
  for (const attachment of attachments ?? []) {
    const list = attachmentsByTask.get(attachment.task_id) ?? []
    list.push(attachment)
    attachmentsByTask.set(attachment.task_id, list)
  }

  return tasks.map((task) => ({
    ...task,
    attachments: attachmentsByTask.get(task.id) ?? [],
  }))
}

/** Dashboard'daki "Görevlerim" listesi: owner tüm açık görevleri, diğerleri sadece kendine atananları görür. */
export async function getOpenTasksForViewer(
  viewerRole: TeamMemberRole
): Promise<ClientTaskWithCustomer[]> {
  let query = supabase
    .from("client_tasks")
    .select("*, customer:customers(id, company_name)")
    .neq("status", "tamamlandi")
    .order("due_date", { ascending: true, nullsFirst: false })

  if (viewerRole !== "owner") {
    query = query.eq("assigned_to", viewerRole)
  }

  const { data, error } = await query
  if (error) fail("Görevler alınamadı", error)
  return data as unknown as ClientTaskWithCustomer[]
}

export async function getClientAdReports(customerId: string): Promise<ClientAdReport[]> {
  const { data, error } = await supabase
    .from("client_ad_reports")
    .select("*")
    .eq("customer_id", customerId)
    .order("period", { ascending: false })

  if (error) fail("Meta raporları alınamadı", error)
  return data
}

/** viewerRole owner değilse sadece kendisine atanan görevler, owner ise hepsi — hafif alan seçimiyle. */
async function getVisibleTasksLite(
  viewerRole: TeamMemberRole
): Promise<{ id: string; title: string; customer_id: string; customer_name: string }[]> {
  let query = supabase.from("client_tasks").select("id, title, customer_id, customer:customers(company_name)")

  if (viewerRole !== "owner") {
    query = query.eq("assigned_to", viewerRole)
  }

  const { data, error } = await query
  if (error) fail("Görevler alınamadı", error)

  return (data ?? []).map((t) => {
    const customer = t.customer as unknown as { company_name: string } | null
    return {
      id: t.id,
      title: t.title,
      customer_id: t.customer_id,
      customer_name: customer?.company_name ?? "",
    }
  })
}

/** Sunumlar/Video Montajları sayfaları: viewer'ın görebildiği görevlerdeki, belirli türdeki tüm ekler. */
export async function getAttachmentsForViewer(
  viewerRole: TeamMemberRole,
  kind: TaskAttachmentKind
): Promise<AttachmentWithContext[]> {
  const tasks = await getVisibleTasksLite(viewerRole)
  if (tasks.length === 0) return []

  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const taskIds = tasks.map((t) => t.id)

  const { data, error } = await supabase
    .from("client_task_attachments")
    .select("*")
    .in("task_id", taskIds)
    .eq("kind", kind)
    .order("created_at", { ascending: false })

  if (error) fail("Ekler alınamadı", error)

  return (data ?? []).flatMap((attachment) => {
    const task = taskMap.get(attachment.task_id)
    if (!task) return []
    return [
      {
        ...attachment,
        taskId: task.id,
        taskTitle: task.title,
        customerId: task.customer_id,
        customerName: task.customer_name,
      },
    ]
  })
}

/** Reklam Raporları sayfası: tüm müşterilerin Meta rapor kayıtları, müşteri adıyla. */
export async function getAllAdReports(): Promise<ClientAdReportWithCustomer[]> {
  const { data, error } = await supabase
    .from("client_ad_reports")
    .select("*, customer:customers(id, company_name)")
    .order("period", { ascending: false })

  if (error) fail("Meta raporları alınamadı", error)
  return data as unknown as ClientAdReportWithCustomer[]
}

const EMPTY_CATEGORY_COUNTS: Record<ClientTaskCategory, number> = {
  video: 0,
  reklam: 0,
  yapay_zeka: 0,
  diger: 0,
}

/** Dashboard/Profil'deki motivasyon istatistikleri: tamamlanan/açık/gecikmiş görev sayıları. */
export async function getTaskStatsForViewer(viewerRole: TeamMemberRole): Promise<TaskStats> {
  let query = supabase.from("client_tasks").select("status, category, completed_at, due_date")

  if (viewerRole !== "owner") {
    query = query.eq("assigned_to", viewerRole)
  }

  const { data, error } = await query
  if (error) fail("İstatistikler alınamadı", error)

  const tasks = data ?? []
  const today = todayIso()
  const monthPrefix = today.slice(0, 7)

  const completed = tasks.filter((t) => t.status === "tamamlandi")
  const completedThisMonth = completed.filter(
    (t) => t.completed_at && t.completed_at.slice(0, 7) === monthPrefix
  ).length
  const openCount = tasks.filter((t) => t.status !== "tamamlandi").length
  const overdueCount = tasks.filter(
    (t) => t.status !== "tamamlandi" && t.due_date && t.due_date < today
  ).length

  const byCategory: Record<ClientTaskCategory, number> = { ...EMPTY_CATEGORY_COUNTS }
  for (const t of completed) {
    byCategory[t.category as ClientTaskCategory] += 1
  }

  return {
    completedThisMonth,
    completedTotal: completed.length,
    openCount,
    overdueCount,
    byCategory,
  }
}

/** Hata Takibi: tüm YZ hata kayıtları, müşteri adıyla — açık/kritik önce, çözülenler en sonda. */
export async function getAiBugs(): Promise<AiBugWithCustomer[]> {
  const { data, error } = await supabase
    .from("ai_bugs")
    .select("*, customer:customers(id, company_name)")
    .order("created_at", { ascending: false })

  if (error) fail("Hatalar alınamadı", error)
  return sortBugs((data ?? []) as unknown as AiBugWithCustomer[])
}

/** Notlar: tüm not kayıtları, en yeni önce (sayfada güne göre gruplanır). */
export async function getPanelNotes(): Promise<PanelNote[]> {
  const { data, error } = await supabase
    .from("panel_notes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) fail("Notlar alınamadı", error)
  return data
}
