"use client"

import { useState, useTransition } from "react"
import { ExternalLink, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { deleteMeeting } from "@/lib/actions/panel"
import { TEAM_MEMBER_LABEL, formatMeetingDateTime, isMeetingUpcoming } from "@/lib/panel"
import type { PanelMeeting } from "@/lib/types"
import { cn } from "@/lib/utils"

function MeetingRow({ meeting, nowIso }: { meeting: PanelMeeting; nowIso: string }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const upcoming = isMeetingUpcoming(meeting, nowIso)

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteMeeting(meeting.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{meeting.title}</span>
          <Badge
            variant="outline"
            className={cn(
              "font-normal",
              upcoming
                ? "bg-sky-50 text-sky-700 border-sky-200"
                : "text-muted-foreground"
            )}
          >
            {formatMeetingDateTime(meeting.meeting_at)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {meeting.participants.map((p) => (
            <Badge key={p} variant="outline" className="font-normal text-muted-foreground">
              {TEAM_MEMBER_LABEL[p]}
            </Badge>
          ))}
        </div>
        {meeting.note ? (
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{meeting.note}</p>
        ) : null}
        {meeting.link ? (
          <a
            href={meeting.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Toplantı linki
          </a>
        ) : null}
      </div>

      <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isDeleting}>
        <Trash2 className="size-3.5" />
        <span className="sr-only">Toplantıyı sil</span>
      </Button>
    </div>
  )
}

export function MeetingList({
  meetings,
  nowIso,
  emptyLabel = "Toplantı yok.",
}: {
  meetings: PanelMeeting[]
  nowIso: string
  emptyLabel?: string
}) {
  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-20 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {meetings.map((meeting) => (
          <MeetingRow key={meeting.id} meeting={meeting} nowIso={nowIso} />
        ))}
      </CardContent>
    </Card>
  )
}
