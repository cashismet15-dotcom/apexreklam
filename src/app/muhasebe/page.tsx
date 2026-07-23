import { DueToday } from "@/components/dashboard/due-today"
import { GrowthChart } from "@/components/dashboard/growth-chart"
import { NotPaidThisMonth } from "@/components/dashboard/not-paid-this-month"
import { RecentPayments } from "@/components/dashboard/recent-payments"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { UpcomingCollections } from "@/components/dashboard/upcoming-collections"
import { PageHeader } from "@/components/layout/page-header"
import {
  bugunOdemeYapacaklar,
  buAyOdemeYapmayanlar,
  computeCollectionStatuses,
  computeDashboardStats,
  computeGrowthStats,
  computeMonthlyRevenueTrend,
  computeMrrGrowthTrend,
  sonOdemeler,
  yaklasanTahsilatlar,
} from "@/lib/collections"
import { getDashboardData } from "@/lib/data"

export default async function DashboardPage() {
  const { customers, payments } = await getDashboardData()

  const statuses = computeCollectionStatuses(customers, payments)
  const stats = computeDashboardStats(statuses, payments)
  const revenueTrend = computeMonthlyRevenueTrend(payments, 6)
  const growthStats = computeGrowthStats(customers)
  const growthTrend = computeMrrGrowthTrend(customers, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Aylık tahsilat takibi ve nakit akışı tek bakışta."
      />

      <StatsGrid stats={stats} />

      <GrowthChart stats={growthStats} trend={growthTrend} />

      <RevenueChart entries={revenueTrend} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <UpcomingCollections items={yaklasanTahsilatlar(statuses)} />
          <NotPaidThisMonth items={buAyOdemeYapmayanlar(statuses)} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-1">
          <DueToday items={bugunOdemeYapacaklar(statuses)} />
          <RecentPayments payments={sonOdemeler(payments)} />
        </div>
      </div>
    </div>
  )
}
