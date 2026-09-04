import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AttachmentList } from "@/components/panel/attachment-list"
import { QuickLinkButton } from "@/components/panel/quick-link-button"
import { getSessionRole } from "@/lib/auth-role"
import { getCustomersForSelect } from "@/lib/data"
import { toTeamRole } from "@/lib/panel"
import { getAttachmentsForViewer } from "@/lib/panel-data"

export default async function PanelVideolarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const [attachments, customers] = await Promise.all([
    getAttachmentsForViewer(role, "link"),
    getCustomersForSelect(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Video Montajları"
        description="Eklenen Google Drive/YouTube video linkleri — tek yerde."
        actions={<QuickLinkButton customers={customers} />}
      />
      <AttachmentList attachments={attachments} emptyLabel="Henüz link eklenmedi." />
    </div>
  )
}
