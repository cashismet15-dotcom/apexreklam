"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BugStatusControl } from "@/components/panel/bug-status-control"
import { deleteAiBug } from "@/lib/actions/panel"
import { formatDate } from "@/lib/format"
import { BUG_SEVERITY_LABEL, BUG_SEVERITY_STYLE } from "@/lib/panel"
import type { AiBugWithCustomer } from "@/lib/types"

function BugRow({ bug }: { bug: AiBugWithCustomer }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteAiBug(bug.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {bug.image_url ? (
        <a
          href={bug.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 overflow-hidden rounded-lg border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bug.image_url} alt="" className="size-12 object-cover" />
        </a>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={BUG_SEVERITY_STYLE[bug.severity]}>
            {BUG_SEVERITY_LABEL[bug.severity]}
          </Badge>
          <span className="text-sm font-medium">{bug.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {bug.customer ? (
            <Link href={`/panel/${bug.customer.id}`} className="hover:text-foreground hover:underline">
              {bug.customer.company_name}
            </Link>
          ) : (
            "Genel"
          )}
          {" · "}
          {formatDate(bug.created_at)}
        </span>
        {bug.description ? (
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{bug.description}</p>
        ) : null}
      </div>

      <BugStatusControl bugId={bug.id} status={bug.status} />

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Hata kaydını sil</span>
      </button>
    </div>
  )
}

export function BugList({ bugs }: { bugs: AiBugWithCustomer[] }) {
  if (bugs.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          Henüz hata kaydedilmedi.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {bugs.map((bug) => (
          <BugRow key={bug.id} bug={bug} />
        ))}
      </CardContent>
    </Card>
  )
}
