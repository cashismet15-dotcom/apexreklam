import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, ListTodo, Sparkles, TriangleAlert } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AddMeetingButton } from "@/components/panel/add-meeting-button"
import { MeetingList } from "@/components/panel/meeting-list"
import { OpenTasksList } from "@/components/panel/open-tasks-list"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { getSessionRole } from "@/lib/auth-role"
import { todayIso } from "@/lib/daily-tracker"
import { TEAM_MEMBER_LABEL, toTeamRole } from "@/lib/panel"
import { getOpenTasksForViewer, getTaskStatsForViewer, getUpcomingMeetings } from "@/lib/panel-data"

function motivationMessage(completedThisMonth: number, overdueCount: number): string {
  if (overdueCount > 0) {
    return `${overdueCount} görevin gecikmiş — önce onları toparlayalım.`
  }
  if (completedThisMonth === 0) {
    return "Bu ay henüz tamamlanan görev yok — ilk işi bitirip listeyi başlat!"
  }
  if (completedThisMonth < 5) {
    return "Güzel gidiyor, devam et."
  }
  return "Harika bir ay geçiriyorsun! 🔥"
}

export default async function PanelDashboardPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const [tasks, stats, meetings] = await Promise.all([
    getOpenTasksForViewer(role),
    getTaskStatsForViewer(role),
    getUpcomingMeetings(),
  ])

  const today = todayIso()
  const nowIso = new Date().toISOString()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Hoş geldin, ${TEAM_MEMBER_LABEL[role]}.`}
      />

      <Card>
        <CardContent className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4.5" />
          </div>
          <p className="text-sm font-medium">
            {motivationMessage(stats.completedThisMonth, stats.overdueCount)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bu Ay Tamamlanan"
          value={String(stats.completedThisMonth)}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Toplam Tamamlanan"
          value={String(stats.completedTotal)}
          icon={Sparkles}
          tone="violet"
        />
        <StatCard label="Açık Görev" value={String(stats.openCount)} icon={ListTodo} tone="blue" />
        <StatCard
          label="Gecikmiş"
          value={String(stats.overdueCount)}
          icon={stats.overdueCount > 0 ? TriangleAlert : Clock}
          tone={stats.overdueCount > 0 ? "red" : "amber"}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Yaklaşan Toplantılar</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/panel/toplantilar"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Tümünü gör
            </Link>
            <AddMeetingButton defaultParticipant={role} />
          </div>
        </div>
        <MeetingList meetings={meetings} nowIso={nowIso} emptyLabel="Yaklaşan toplantı yok." />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {role === "owner" ? "Açık Görevler" : "Görevlerim"}
        </h2>
        <OpenTasksList tasks={tasks} todayIso={today} />
      </div>
    </div>
  )
}
