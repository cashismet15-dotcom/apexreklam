import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AddNoteForm } from "@/components/panel/add-note-form"
import { NoteList } from "@/components/panel/note-list"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getSessionRole } from "@/lib/auth-role"
import { groupNotesByDay, toTeamRole } from "@/lib/panel"
import { getPanelNotes } from "@/lib/panel-data"

export default async function PanelNotlarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const notes = await getPanelNotes()
  const groups = groupNotesByDay(notes)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notlar" description="Hızlı, paylaşımlı not defteri." />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <AddNoteForm />
          <Separator />
          <NoteList groups={groups} />
        </CardContent>
      </Card>
    </div>
  )
}
