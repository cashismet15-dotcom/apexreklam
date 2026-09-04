"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TaskFormDialog } from "@/components/panel/task-form-dialog"
import type { TeamMemberRole } from "@/lib/types"

export function AddTaskButton({
  customerId = null,
  defaultAssignee,
}: {
  /** Verilmezse genel/dahili bir görev oluşturulur — belirli bir müşteriye bağlı değil. */
  customerId?: string | null
  defaultAssignee: TeamMemberRole
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Görev Ekle
      </Button>
      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        customerId={customerId}
        defaultAssignee={defaultAssignee}
      />
    </>
  )
}
