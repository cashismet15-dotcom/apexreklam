"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TaskFormDialog } from "@/components/panel/task-form-dialog"
import type { TeamMemberRole } from "@/lib/types"

export function AddTaskButton({
  customerId = null,
  defaultAssignee,
  defaultDurationDays,
  label = "Görev Ekle",
}: {
  /** Verilmezse genel/dahili bir görev oluşturulur — belirli bir müşteriye bağlı değil. */
  customerId?: string | null
  defaultAssignee: TeamMemberRole
  /** Örn. "Bugün" sütunundan açılırsa 0, "Yarın"dan açılırsa 1 — süre alanını önceden doldurur. */
  defaultDurationDays?: number
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        {label}
      </Button>
      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        customerId={customerId}
        defaultAssignee={defaultAssignee}
        defaultDurationDays={defaultDurationDays}
      />
    </>
  )
}
