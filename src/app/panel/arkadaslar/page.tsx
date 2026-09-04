import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import { initials } from "@/lib/format"
import { TEAM_MEMBERS, toTeamRole } from "@/lib/panel"
import { getTaskStatsForRole } from "@/lib/panel-data"

export default async function PanelArkadaslarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const members = await Promise.all(
    TEAM_MEMBERS.map(async (m) => ({ member: m, stats: await getTaskStatsForRole(m.value) }))
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Arkadaşlar" description="Ekip — kim ne üzerinde çalışıyor." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {members.map(({ member, stats }) => (
          <Card key={member.value}>
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {initials(member.label)}
              </div>
              <div>
                <p className="font-semibold">{member.label}</p>
                <p className="text-xs text-muted-foreground">
                  {member.value === "owner" ? "Tam yetkili" : "Ekip üyesi"}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 py-2">
                  <p className="text-base font-semibold tabular-nums">{stats.openCount}</p>
                  <p className="text-xs text-muted-foreground">Açık Görev</p>
                </div>
                <div className="rounded-lg bg-muted/50 py-2">
                  <p className="text-base font-semibold tabular-nums">{stats.completedThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Bu Ay Bitti</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
