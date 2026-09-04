"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MeetingFormDialog } from "@/components/panel/meeting-form-dialog"
import type { TeamMemberRole } from "@/lib/types"

export function AddMeetingButton({ defaultParticipant }: { defaultParticipant: TeamMemberRole }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Toplantı Ekle
      </Button>
      <MeetingFormDialog open={open} onOpenChange={setOpen} defaultParticipant={defaultParticipant} />
    </>
  )
}
