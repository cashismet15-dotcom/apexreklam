import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AddTaskButton } from "@/components/panel/add-task-button"
import { AdReportForm } from "@/components/panel/ad-report-form"
import { AdReportList } from "@/components/panel/ad-report-list"
import { EditClientButton } from "@/components/panel/edit-client-button"
import { PaymentStatusBadge } from "@/components/panel/payment-status-badge"
import { TaskList } from "@/components/panel/task-list"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import { computeCollectionStatuses } from "@/lib/collections"
import { getPaymentsForCustomer } from "@/lib/data"
import { todayIso } from "@/lib/daily-tracker"
import { formatCurrency, formatDate } from "@/lib/format"
import { canManageCustomers, toTeamRole } from "@/lib/panel"
import { getClientAdReports, getClientTasks, getPanelCustomerById } from "@/lib/panel-data"

export default async function PanelCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const customer = await getPanelCustomerById(id)
  if (!customer) notFound()

  const [tasks, reports, payments] = await Promise.all([
    getClientTasks(id, role),
    getClientAdReports(id),
    getPaymentsForCustomer(id),
  ])

  const [status] = computeCollectionStatuses([customer], payments)
  const today = todayIso()

  const activeTasks = tasks.filter((t) => t.status !== "tamamlandi")
  const completedTasks = tasks.filter((t) => t.status === "tamamlandi")

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link
        href="/panel/sirketler"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Şirketler&apos;e dön
      </Link>

      <PageHeader
        title={customer.company_name}
        description={`${customer.contact_name} · ${customer.phone}`}
        actions={status ? <PaymentStatusBadge status={status} /> : null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Şirket Bilgileri</CardTitle>
          {canManageCustomers(role) ? (
            <CardAction>
              <EditClientButton customer={customer} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yetkili</span>
            <span>{customer.contact_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefon</span>
            <span>{customer.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Başlangıç</span>
            <span>{formatDate(customer.start_date)}</span>
          </div>
          {role === "owner" ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aylık Ücret</span>
                <span>{formatCurrency(customer.monthly_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ödeme Günü</span>
                <span>Her ayın {customer.payment_day}&apos;i</span>
              </div>
              <Link
                href={`/muhasebe/musteriler/${customer.id}`}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Muhasebe&apos;de detaylı ödeme geçmişini gör →
              </Link>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Aktif Görevler {activeTasks.length > 0 ? `(${activeTasks.length})` : ""}
          </h2>
          <AddTaskButton customerId={id} defaultAssignee={role} />
        </div>
        <TaskList tasks={activeTasks} todayIso={today} emptyLabel="Aktif görev yok." />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Tamamlanmış Görevler {completedTasks.length > 0 ? `(${completedTasks.length})` : ""}
        </h2>
        <TaskList tasks={completedTasks} todayIso={today} emptyLabel="Henüz tamamlanmış görev yok." />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Meta Reklam Raporu</h2>
        <AdReportForm customerId={id} />
        <AdReportList reports={reports} />
      </div>
    </div>
  )
}
