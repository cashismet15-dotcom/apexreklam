import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AddBugButton } from "@/components/panel/add-bug-button"
import { BugList } from "@/components/panel/bug-list"
import { getSessionRole } from "@/lib/auth-role"
import { getCustomersForSelect } from "@/lib/data"
import { toTeamRole } from "@/lib/panel"
import { getAiBugs } from "@/lib/panel-data"

export default async function PanelHatalarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const [bugs, customers] = await Promise.all([getAiBugs(), getCustomersForSelect()])
  const openCount = bugs.filter((b) => b.status !== "cozuldu").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hata Takibi"
        description={
          openCount > 0
            ? `${openCount} açık hata var.`
            : "Yapay zeka sistemlerindeki hatalar — müşteriye bağlı veya genel."
        }
        actions={<AddBugButton customers={customers} />}
      />
      <BugList bugs={bugs} />
    </div>
  )
}
