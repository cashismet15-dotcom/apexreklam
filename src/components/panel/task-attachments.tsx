"use client"

import { useState, useTransition } from "react"
import { FileText, Trash2, Video } from "lucide-react"

import { deleteTaskAttachment } from "@/lib/actions/panel"
import { formatFileSize } from "@/lib/format"
import type { ClientTaskAttachment } from "@/lib/types"

function AttachmentChip({ attachment }: { attachment: ClientTaskAttachment }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteTaskAttachment(attachment.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  const Icon = attachment.kind === "link" ? Video : FileText

  return (
    <span className="group/chip inline-flex items-center gap-1 rounded-full border bg-muted/40 py-1 pr-1 pl-2 text-xs">
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="max-w-40 truncate hover:underline"
      >
        {attachment.label}
      </a>
      {attachment.file_size != null ? (
        <span className="shrink-0 text-muted-foreground">
          ({formatFileSize(attachment.file_size)})
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/chip:opacity-100 disabled:opacity-40"
      >
        <Trash2 className="size-2.5" />
        <span className="sr-only">Eki sil</span>
      </button>
    </span>
  )
}

export function TaskAttachments({ attachments }: { attachments: ClientTaskAttachment[] }) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attachments.map((a) => (
        <AttachmentChip key={a.id} attachment={a} />
      ))}
    </div>
  )
}
