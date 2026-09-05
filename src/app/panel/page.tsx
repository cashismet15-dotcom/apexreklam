import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarCheck, CheckCircle2, Clock, ListTodo, Sparkles, TriangleAlert, UserPlus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { AddMeetingButton } from "@/components/panel/add-meeting-button"
import { MeetingList } from "@/components/panel/meeting-list"
import { NoteList } from "@/components/panel/note-list"
import { TasksByDay } from "@/components/panel/tasks-by-day"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { getSessionRole } from "@/lib/auth-role"
import { todayIso } from "@/lib/daily-tracker"
import { TEAM_MEMBER_LABEL, canViewCustomers, groupNotesByDay, toTeamRole } from "@/lib/panel"
import {
  getGeneralNotes,
  getNewCustomersThisWeekCount,
  getOpenTasksForViewer,
  getTaskStatsForViewer,
  getUpcomingMeetings,
} from "@/lib/panel-data"

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

  const showCustomerStat = canViewCustomers(role)

  const [tasks, stats, meetings, generalNotes, newCustomersThisWeek] = await Promise.all([
    getOpenTasksForViewer(role),
    getTaskStatsForViewer(role),
    getUpcomingMeetings(),
    getGeneralNotes(8),
    showCustomerStat ? getNewCustomersThisWeekCount() : Promise.resolve(0),
  ])
  const noteGroups = groupNotesByDay(generalNotes)

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
          label="Bu Hafta Tamamlanan"
          value={String(stats.completedThisWeek)}
          icon={CalendarCheck}
          tone="emerald"
        />
        <StatCard
          label="Bu Ay Tamamlanan"
          value={String(stats.completedThisMonth)}
          icon={CheckCircle2}
          tone="blue"
        />
        <StatCard label="Açık Görev" value={String(stats.openCount)} icon={ListTodo} tone="indigo" />
        <StatCard
          label="Gecikmiş"
          value={String(stats.overdueCount)}
          icon={stats.overdueCount > 0 ? TriangleAlert : Clock}
          tone={stats.overdueCount > 0 ? "red" : "amber"}
        />
        <StatCard
          label="Toplam Tamamlanan"
          value={String(stats.completedTotal)}
          icon={Sparkles}
          tone="violet"
        />
        {showCustomerStat ? (
          <StatCard
            label="Bu Hafta Eklenen Müşteri"
            value={String(newCustomersThisWeek)}
            icon={UserPlus}
            tone="emerald"
          />
        ) : null}
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Genel Notlar</h2>
          <Link
            href="/panel/notlar"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Tümünü gör
          </Link>
        </div>
        <Card>
          <CardContent>
            <NoteList groups={noteGroups} currentRole={role} emptyLabel="Henüz genel not yok." />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {role === "owner" ? "Açık Görevler" : "Görevlerim"}
        </h2>
        <TasksByDay tasks={tasks} todayIso={today} role={role} />
      </div>
    </div>
  )
}
