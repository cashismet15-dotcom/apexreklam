import Link from "next/link"
import { CheckCircle2, CircleDashed, Clock, Eye, Loader } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { ContentWeekButton } from "@/components/content/content-week-button"
import { PageHeader } from "@/components/layout/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  buildContentOverview,
  computeContentStatusCounts,
  CONTENT_STATUS_LABEL,
  CONTENT_STATUS_STYLE,
  currentWeekStartIso,
} from "@/lib/content"
import { getContentWeeksForWeek, getCustomers } from "@/lib/data"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

export default async function IcerikTakipPage() {
  const weekStart = currentWeekStartIso()
  const [customers, weekEntries] = await Promise.all([
    getCustomers(),
    getContentWeeksForWeek(weekStart),
  ])

  const overview = buildContentOverview(customers, weekEntries)
  const counts = computeContentStatusCounts(overview)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Danışan İçerik Takibi"
        description="Haftalık video üretim süreci, danışan başına talimat ve notlar."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Henüz Başlanmadı"
          value={String(counts.yok)}
          icon={CircleDashed}
          tone="blue"
        />
        <StatCard
          label="Talimat Bekliyor"
          value={String(counts.talimat_bekliyor)}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Hazırlanıyor"
          value={String(counts.hazirlaniyor)}
          icon={Loader}
          tone="indigo"
        />
        <StatCard label="Onayda" value={String(counts.onayda)} icon={Eye} tone="violet" />
        <StatCard
          label="Yayınlandı"
          value={String(counts.yayinlandi)}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Danışan</TableHead>
                <TableHead>Bu Hafta</TableHead>
                <TableHead>Not</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aktif danışan yok.
                  </TableCell>
                </TableRow>
              ) : (
                overview.map(({ customer, currentWeek }) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/icerik-takip/${customer.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar size="sm">
                          <AvatarImage
                            src={customer.logo_url ?? undefined}
                            alt={customer.company_name}
                          />
                          <AvatarFallback>{initials(customer.company_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium hover:underline">
                          {customer.company_name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {currentWeek ? (
                        <Badge
                          variant="outline"
                          className={cn("font-normal", CONTENT_STATUS_STYLE[currentWeek.status])}
                        >
                          {CONTENT_STATUS_LABEL[currentWeek.status]}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-normal bg-muted text-muted-foreground border-transparent"
                        >
                          Henüz başlanmadı
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-1 text-sm text-muted-foreground">
                        {currentWeek?.note || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <ContentWeekButton
                          customerId={customer.id}
                          companyName={customer.company_name}
                          weekStart={weekStart}
                          currentWeek={currentWeek}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
