import Link from "next/link"
import { ExternalLink, FileText, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatFileSize } from "@/lib/format"
import type { AttachmentWithContext } from "@/lib/types"

export function AttachmentList({
  attachments,
  emptyLabel,
}: {
  attachments: AttachmentWithContext[]
  emptyLabel: string
}) {
  if (attachments.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {attachments.map((attachment) => {
          const Icon = attachment.kind === "link" ? Video : FileText
          return (
            <div key={attachment.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{attachment.label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  <Link
                    href={`/panel/${attachment.customerId}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {attachment.customerName}
                  </Link>
                  {" · "}
                  {attachment.taskTitle}
                  {attachment.file_size != null ? ` · ${formatFileSize(attachment.file_size)}` : ""}
                  {` · ${formatDate(attachment.created_at)}`}
                </span>
              </div>
              <Button asChild variant="ghost" size="icon-sm">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  <span className="sr-only">Aç</span>
                </a>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
