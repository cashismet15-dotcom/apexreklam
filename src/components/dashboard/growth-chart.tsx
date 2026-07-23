"use client"

import { useRef, useState, type PointerEvent } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GrowthStats, MrrGrowthPoint } from "@/lib/collections"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

const CHART_HEIGHT = 160
const PADDING_TOP = 16
const PADDING_BOTTOM = 8

export function GrowthChart({
  stats,
  trend,
}: {
  stats: GrowthStats
  trend: MrrGrowthPoint[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const values = trend.map((p) => p.cumulativeMrr)
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const range = Math.max(1, max - min)
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM

  const points = trend.map((p, i) => {
    const x = trend.length <= 1 ? 0 : (i / (trend.length - 1)) * 100
    const y = PADDING_TOP + plotHeight - ((p.cumulativeMrr - min) / range) * plotHeight
    return { x, y, point: p }
  })

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const baseline = CHART_HEIGHT - PADDING_BOTTOM
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
      : ""

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!el || points.length === 0) return
    const rect = el.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const idx = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.min(points.length - 1, Math.max(0, idx)))
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const hasWeeklyGrowth = stats.newCustomersThisWeek > 0 || stats.newMrrThisWeek > 0
  const showLabel = (i: number) =>
    i === 0 || i === trend.length - 1 || i === hoverIndex || trend.length <= 6 || i % 2 === 0

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b py-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold">Sistem Büyümesi</CardTitle>
          <span className="text-xs text-muted-foreground">
            Aktif müşteri tabanı ve aylık gelir (MRR), son {trend.length} hafta
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(stats.totalMrr)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              hasWeeklyGrowth
                ? "bg-emerald-50 text-emerald-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {hasWeeklyGrowth ? "+" : ""}
            {stats.newCustomersThisWeek} müşteri · {hasWeeklyGrowth ? "+" : ""}
            {formatCurrency(stats.newMrrThisWeek)} bu hafta
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {trend.length > 1 ? (
          <div
            ref={containerRef}
            className="relative touch-none"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <svg
              viewBox={`0 0 100 ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              className="h-40 w-full overflow-visible"
            >
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <path d={areaPath} fill="url(#growthFill)" stroke="none" />
              <path
                d={linePath}
                fill="none"
                className="stroke-violet-600"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hovered ? (
                <line
                  x1={hovered.x}
                  x2={hovered.x}
                  y1={PADDING_TOP}
                  y2={baseline}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-border"
                />
              ) : null}

              {points.map((p, i) => {
                const isLast = i === points.length - 1
                const isHovered = hoverIndex === i
                if (!isLast && !isHovered) return null
                return (
                  <circle
                    key={p.point.weekStart}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={2}
                    className="fill-violet-600 stroke-card"
                  />
                )
              })}
            </svg>

            {hovered ? (
              <div
                className="pointer-events-none absolute top-0 z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm"
                style={{
                  left: `${hovered.x}%`,
                  transform: `translate(${hovered.x > 85 ? "-100%" : hovered.x < 15 ? "0%" : "-50%"}, calc(-100% - 8px))`,
                }}
              >
                <div className="font-medium text-popover-foreground">
                  {formatCurrency(hovered.point.cumulativeMrr)}
                </div>
                <div className="text-muted-foreground">
                  {hovered.point.cumulativeCustomers} müşteri
                  {hovered.point.newCustomers > 0 ? ` · +${hovered.point.newCustomers} bu hafta` : ""}
                </div>
              </div>
            ) : null}

            <div className="mt-2 flex justify-between">
              {trend.map((p, i) => (
                <span
                  key={p.weekStart}
                  className={cn(
                    "text-xs",
                    i === hoverIndex ? "font-medium text-foreground" : "text-muted-foreground",
                    showLabel(i) ? "" : "invisible"
                  )}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Trend için yeterli veri yok.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
