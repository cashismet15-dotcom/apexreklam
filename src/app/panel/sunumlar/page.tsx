import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { DocumentList } from "@/components/documents/document-list"
import { QuickUploadButton } from "@/components/panel/quick-upload-button"
import { getSessionRole } from "@/lib/auth-role"
import { getDocuments } from "@/lib/documents-data"
import { toTeamRole } from "@/lib/panel"

function isPdf(fileType: string | null, name: string): boolean {
  return fileType === "application/pdf" || name.toLowerCase().endsWith(".pdf")
}

export default async function PanelSunumlarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const documents = await getDocuments()
  const presentations = documents.filter((doc) => isPdf(doc.file_type, doc.name))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sunumlar"
        description="Şirkete bağlı olmayan, genel sunum kütüphanesi."
        actions={<QuickUploadButton />}
      />
      <DocumentList documents={presentations} />
    </div>
  )
}
