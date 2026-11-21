import Link from "next/link"
import { MapPin, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FIRM_STAGE_LABEL, FIRM_STAGE_STYLE } from "@/lib/firms"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Firm } from "@/lib/types"

export function FirmCards({ firms, emptyLabel }: { firms: Firm[]; emptyLabel: string }) {
  if (firms.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {firms.map((firm) => (
        <Link
          key={firm.id}
          href={`/panel/firmalar/${firm.id}`}
          className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold">{firm.name}</span>
            <Badge variant="outline" className={cn("shrink-0", FIRM_STAGE_STYLE[firm.stage])}>
              {FIRM_STAGE_LABEL[firm.stage]}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {firm.source === "site" ? (
              <span className="rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">
                Siteden
              </span>
            ) : null}
            {firm.city ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {firm.city}
              </span>
            ) : null}
            {firm.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="size-3" />
                {firm.phone}
              </span>
            ) : null}
          </div>
          {firm.firm_services ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{firm.firm_services}</p>
          ) : null}
          <span className="mt-auto text-[11px] text-muted-foreground">
            Eklendi: {formatDate(firm.created_at)}
          </span>
        </Link>
      ))}
    </div>
  )
}
