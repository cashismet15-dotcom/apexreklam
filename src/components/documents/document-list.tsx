import {
  ExternalLink,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DocumentRowActions } from "@/components/documents/document-row-actions"
import { formatDate, formatFileSize } from "@/lib/format"
import type { DocumentFile } from "@/lib/types"

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "svg"]
const SHEET_EXT = ["xls", "xlsx", "csv"]
const SLIDE_EXT = ["ppt", "pptx", "key"]
const ARCHIVE_EXT = ["zip", "rar", "7z"]
const DOC_EXT = ["pdf", "doc", "docx", "txt", "rtf"]

function fileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

function DocIcon({ doc }: { doc: DocumentFile }) {
  const ext = fileExt(doc.name)
  if (IMAGE_EXT.includes(ext)) return <ImageIcon className="size-4" />
  if (SHEET_EXT.includes(ext)) return <FileSpreadsheet className="size-4" />
  if (SLIDE_EXT.includes(ext)) return <Presentation className="size-4" />
  if (ARCHIVE_EXT.includes(ext)) return <FileArchive className="size-4" />
  if (DOC_EXT.includes(ext)) return <FileText className="size-4" />
  return <File className="size-4" />
}

export function DocumentList({ documents }: { documents: DocumentFile[] }) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Henüz döküman yüklenmedi.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DocIcon doc={doc} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{doc.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
              </span>
              {doc.note ? (
                <span className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                  {doc.note}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon-sm">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  <span className="sr-only">Aç</span>
                </a>
              </Button>
              <DocumentRowActions doc={doc} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
