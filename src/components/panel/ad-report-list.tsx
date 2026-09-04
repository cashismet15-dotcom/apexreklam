"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { deleteAdReport } from "@/lib/actions/panel"
import { formatCurrency } from "@/lib/format"
import { formatPeriodLabel } from "@/lib/panel"
import type { ClientAdReport } from "@/lib/types"

function ReportRow({ report }: { report: ClientAdReport }) {
  const [removed, setRemoved] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setRemoved(true)
    startDelete(async () => {
      const result = await deleteAdReport(report.id)
      if (result.status === "error") setRemoved(false)
    })
  }

  if (removed) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">{formatPeriodLabel(report.period)}</span>
          {report.spend != null ? (
            <span className="text-xs text-muted-foreground">{formatCurrency(report.spend)}</span>
          ) : null}
        </div>
        {report.note ? (
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{report.note}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Raporu sil</span>
      </button>
    </div>
  )
}

export function AdReportList({ reports }: { reports: ClientAdReport[] }) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-20 items-center justify-center text-sm text-muted-foreground">
          Henüz rapor eklenmedi.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y p-0">
        {reports.map((report) => (
          <ReportRow key={report.id} report={report} />
        ))}
      </CardContent>
    </Card>
  )
}
