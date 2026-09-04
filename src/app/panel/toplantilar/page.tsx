import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AddMeetingButton } from "@/components/panel/add-meeting-button"
import { MeetingList } from "@/components/panel/meeting-list"
import { getSessionRole } from "@/lib/auth-role"
import { toTeamRole } from "@/lib/panel"
import { getAllMeetings } from "@/lib/panel-data"

export default async function PanelToplantilarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const meetings = await getAllMeetings()
  const nowIso = new Date().toISOString()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Toplantılar"
        description="Tüm toplantılar — yaklaşanlar üstte."
        actions={<AddMeetingButton defaultParticipant={role} />}
      />
      <MeetingList meetings={meetings} nowIso={nowIso} emptyLabel="Henüz toplantı eklenmedi." />
    </div>
  )
}
