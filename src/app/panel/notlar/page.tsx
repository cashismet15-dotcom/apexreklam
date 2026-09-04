import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AddNoteForm } from "@/components/panel/add-note-form"
import { NoteList } from "@/components/panel/note-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getSessionRole } from "@/lib/auth-role"
import { groupNotesByDay, toTeamRole } from "@/lib/panel"
import { getGeneralNotes, getMyPrivateNotes } from "@/lib/panel-data"

export default async function PanelNotlarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const [myNotes, generalNotes] = await Promise.all([getMyPrivateNotes(role), getGeneralNotes()])
  const myGroups = groupNotesByDay(myNotes)
  const generalGroups = groupNotesByDay(generalNotes)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notlar" description="Kişisel notların ve ekibin paylaştığı notlar." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notlarım</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Sadece sen görürsün.</p>
            <AddNoteForm isPrivate placeholder="Sadece sana özel bir not yaz..." />
            <Separator />
            <NoteList groups={myGroups} currentRole={role} emptyLabel="Henüz kişisel notun yok." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Genel Notlar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Herkes görür, herkes yazabilir.</p>
            <AddNoteForm isPrivate={false} placeholder="Ekiple paylaşılacak bir not yaz..." />
            <Separator />
            <NoteList groups={generalGroups} currentRole={role} emptyLabel="Henüz genel not yok." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
