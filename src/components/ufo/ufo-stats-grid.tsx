import { CalendarClock, ClipboardList, Hourglass, SprayCan, Wallet } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { formatCurrency } from "@/lib/format"
import type { UfoStats } from "@/lib/ufo"

export function UfoStatsGrid({ stats }: { stats: UfoStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label="Toplam Ciro"
        value={formatCurrency(stats.totalRevenue)}
        helper="Tamamlanan işler, net (komisyon düşülmüş)"
        icon={Wallet}
        tone="emerald"
      />
      <StatCard
        label="Bu Ay Ciro"
        value={formatCurrency(stats.thisMonthRevenue)}
        icon={SprayCan}
        tone="blue"
      />
      <StatCard
        label="Bekleyen İş"
        value={String(stats.pendingCount)}
        icon={Hourglass}
        tone="amber"
      />
      <StatCard
        label="Bekleyen Randevu"
        value={String(stats.appointmentCount)}
        icon={CalendarClock}
        tone="indigo"
      />
      <StatCard
        label="Toplam İş"
        value={String(stats.totalCount)}
        icon={ClipboardList}
        tone="violet"
      />
    </div>
  )
}
