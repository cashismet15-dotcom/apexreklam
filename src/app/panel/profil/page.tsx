import { notFound } from "next/navigation"
import { CheckCircle2, Clapperboard, Cpu, ListTodo, Megaphone, Sparkles } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import { initials } from "@/lib/format"
import { TASK_CATEGORY_LABEL, TEAM_MEMBER_LABEL, toTeamRole } from "@/lib/panel"
import { getTaskStatsForViewer } from "@/lib/panel-data"

const CATEGORY_ICON = {
  video: Clapperboard,
  reklam: Megaphone,
  yapay_zeka: Cpu,
  diger: Sparkles,
} as const

export default async function PanelProfilPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const stats = await getTaskStatsForViewer(role)
  const label = TEAM_MEMBER_LABEL[role]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profil" description="İstatistiklerin ve rolün." />

      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {initials(label)}
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{label}</span>
            <span className="text-sm text-muted-foreground">
              {role === "owner" ? "Tam yetkili" : "Ekip üyesi"}
            </span>
          </div>
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
          icon={ListTodo}
          tone={stats.overdueCount > 0 ? "red" : "amber"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Kategoriye Göre Tamamlanan İşler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(Object.keys(TASK_CATEGORY_LABEL) as Array<keyof typeof TASK_CATEGORY_LABEL>).map(
            (category) => {
              const Icon = CATEGORY_ICON[category]
              return (
                <div key={category} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-xl font-semibold tabular-nums">
                    {stats.byCategory[category]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {TASK_CATEGORY_LABEL[category]}
                  </span>
                </div>
              )
            }
          )}
        </CardContent>
      </Card>
    </div>
  )
}
