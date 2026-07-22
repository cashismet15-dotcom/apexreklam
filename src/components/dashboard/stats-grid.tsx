import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Hourglass,
  Users,
  Wallet,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { formatCurrency } from "@/lib/format"
import type { DashboardStats } from "@/lib/collections"

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        label="Bu Ay Beklenen Gelir"
        value={formatCurrency(stats.expectedThisMonth)}
        helper="Tüm aktif müşteriler"
        icon={Wallet}
        tone="blue"
      />
      <StatCard
        label="Bu Ay Tahsil Edilen"
        value={formatCurrency(stats.collectedThisMonth)}
        icon={CheckCircle2}
        tone="emerald"
      />
      <StatCard
        label="Bu Ay Kalan Tahsilat"
        value={formatCurrency(stats.remainingThisMonth)}
        icon={Hourglass}
        tone="amber"
      />
      <StatCard
        label="Önümüzdeki 7 Gün Tahsilatı"
        value={formatCurrency(stats.next7Days)}
        icon={CalendarClock}
        tone="violet"
      />
      <StatCard
        label="Önümüzdeki 30 Gün Tahsilatı"
        value={formatCurrency(stats.next30Days)}
        icon={CalendarRange}
        tone="indigo"
      />
      <StatCard
        label="Geciken Ödemeler"
        value={formatCurrency(stats.overdueAmount)}
        helper={`${stats.overdueCount} müşteri`}
        icon={AlertTriangle}
        tone="red"
      />
      <StatCard
        label="Aktif Müşteri Sayısı"
        value={String(stats.activeCustomerCount)}
        icon={Users}
        tone="blue"
      />
    </div>
  )
}
