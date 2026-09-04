"use client"

import { useState, useTransition } from "react"
import { ArrowRightCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { convertLeadToCustomer, deleteLead } from "@/lib/actions/panel"
import { formatDate } from "@/lib/format"
import type { PanelLead } from "@/lib/types"

function LeadRow({ lead }: { lead: PanelLead }) {
  const [removed, setRemoved] = useState(false)
  const [isConverting, startConvert] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const isPending = isConverting || isDeleting

  function handleConvert() {
    setRemoved(true)
    startConvert(async () => {
      const result = await convertLeadToCustomer(lead.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteLead(lead.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{lead.name || lead.phone}</span>
        <span className="text-xs text-muted-foreground">
          {lead.phone}
          {" · "}
          {formatDate(lead.created_at)}
        </span>
        {lead.note ? (
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{lead.note}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleConvert} disabled={isPending}>
          <ArrowRightCircle />
          Müşteriye Dönüştür
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="size-3.5" />
          <span className="sr-only">Sil</span>
        </Button>
      </div>
    </div>
  )
}

export function LeadList({ leads }: { leads: PanelLead[] }) {
  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          Henüz potansiyel müşteri eklenmedi.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}
      </CardContent>
    </Card>
  )
}
