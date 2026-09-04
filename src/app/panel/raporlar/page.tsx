import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import { formatCurrency } from "@/lib/format"
import { formatPeriodLabel, toTeamRole } from "@/lib/panel"
import { getAllAdReports } from "@/lib/panel-data"

export default async function PanelRaporlarPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const reports = await getAllAdReports()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reklam Raporları" description="Tüm müşterilerin aylık Meta reklam raporları." />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            Henüz rapor eklenmedi.
          </CardContent>
        </Card>
      ) : (
        <Card className="gap-0 py-0">
          <CardContent className="flex flex-col divide-y p-0">
            {reports.map((report) => (
              <div key={report.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/panel/${report.customer_id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {report.customer.company_name}
                    </Link>
                    <span className="text-xs text-muted-foreground capitalize">
                      {formatPeriodLabel(report.period)}
                    </span>
                  </div>
                  {report.note ? (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {report.note}
                    </p>
                  ) : null}
                </div>
                {report.spend != null ? (
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(report.spend)}
                  </span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
