import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const tonStyles = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
} as const

export type StatTone = keyof typeof tonStyles

interface StatCardProps {
  label: string
  value: string
  helper?: string
  icon: LucideIcon
  tone: StatTone
}

export function StatCard({ label, value, helper, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className="gap-0 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between px-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </span>
          {helper ? (
            <span className="text-xs text-muted-foreground">{helper}</span>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tonStyles[tone]
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  )
}
