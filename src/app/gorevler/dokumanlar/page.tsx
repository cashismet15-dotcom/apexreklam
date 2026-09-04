import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { PageHeader } from "@/components/layout/page-header"
import { DocumentList } from "@/components/documents/document-list"
import { UploadDocumentButton } from "@/components/documents/upload-document-button"
import { getDocuments } from "@/lib/documents-data"

export default async function DokumanlarPage() {
  const documents = await getDocuments()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/gorevler"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Günlük Görevler&apos;e dön
        </Link>
        <LogoutButton />
      </div>

      <PageHeader
        title="Dökümanlar"
        description="Sunumlar ve belgeler — tek yerde sakla."
        actions={<UploadDocumentButton />}
      />

      <DocumentList documents={documents} />
    </div>
  )
}
