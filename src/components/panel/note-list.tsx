"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { deletePanelNote } from "@/lib/actions/panel"
import { TEAM_MEMBER_LABEL, formatTimeTr, type NoteDayGroup } from "@/lib/panel"
import type { PanelNote } from "@/lib/types"

function NoteRow({ note }: { note: PanelNote }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deletePanelNote(note.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <div className="group/note flex items-start gap-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTimeTr(note.created_at)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="whitespace-pre-wrap text-sm">{note.body}</p>
        <span className="text-xs text-muted-foreground">{TEAM_MEMBER_LABEL[note.author]}</span>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/note:opacity-100 disabled:opacity-40"
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Notu sil</span>
      </button>
    </div>
  )
}

export function NoteList({ groups }: { groups: NoteDayGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Henüz not yok — yukarıdan ilk notunu ekle.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.dateIso}>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </h3>
          <div className="flex flex-col divide-y">
            {group.notes.map((note) => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
