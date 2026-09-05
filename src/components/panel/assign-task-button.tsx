"use client"

import { useState } from "react"
import { ListPlus } from "lucide-react"

import { TaskFormDialog } from "@/components/panel/task-form-dialog"
import type { TeamMemberRole } from "@/lib/types"

const MAX_TITLE_LENGTH = 200

/** Bir metni (not/mesaj) görev başlığına dönüştürür — form şemasının izin verdiği uzunluğa kısaltır. */
function toTaskTitle(text: string): string {
  const trimmed = text.trim()
  return trimmed.length > MAX_TITLE_LENGTH ? `${trimmed.slice(0, MAX_TITLE_LENGTH - 1)}…` : trimmed
}

export function AssignTaskButton({
  sourceText,
  defaultAssignee,
  className,
}: {
  sourceText: string
  defaultAssignee: TeamMemberRole
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        }
      >
        <ListPlus className="size-3.5" />
        Görev Ata
      </button>
      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        customerId={null}
        defaultAssignee={defaultAssignee}
        defaultTitle={toTaskTitle(sourceText)}
        defaultDurationDays={0}
      />
    </>
  )
}
