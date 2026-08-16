import Link from "next/link"
import { ArrowLeft, MapPin, MessageCircle, Users } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "@/components/auth/logout-button"
import { NewYakamozJobButton } from "@/components/yakamoz/new-yakamoz-job-button"
import { YakamozFilterButton } from "@/components/yakamoz/yakamoz-filter-button"
import { YakamozJobRowActions } from "@/components/yakamoz/yakamoz-job-row-actions"
import { YakamozStatusControl } from "@/components/yakamoz/yakamoz-status-control"
import { getSessionRole } from "@/lib/auth-role"
import { getYakamozJobs } from "@/lib/yakamoz-data"
import { groupYakamozJobsByIlce } from "@/lib/yakamoz"
import { formatDate, formatTime } from "@/lib/format"

export default async function YakamozPage({
  searchParams,
}: {
  searchParams: Promise<{ ilce?: string }>
}) {
  const [{ ilce }, jobs, session] = await Promise.all([
    searchParams,
    getYakamozJobs(),
    getSessionRole(),
  ])

  const filteredJobs = ilce ? jobs.filter((job) => job.ilce === ilce) : jobs
  const grouped = groupYakamozJobsByIlce(filteredJobs)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        {session?.role === "owner" ? (
          <Link
            href="/"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Ana Sayfa
          </Link>
        ) : (
          <span />
        )}
        <LogoutButton />
      </div>

      <PageHeader
        title="Yakamoz Halı Yıkama"
        description="Müşteri, randevu ve kurye/servis takibi."
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href="/yakamoz/whatsapp">
                <MessageCircle />
                WhatsApp
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/yakamoz/musteriler">
                <Users />
                Müşteriler
              </Link>
            </Button>
            <YakamozFilterButton currentIlce={ilce} />
            <NewYakamozJobButton />
          </>
        }
      />

      {grouped.size === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {ilce ? `${ilce} için kayıt yok.` : "Henüz randevu kaydı yok."}
          </CardContent>
        </Card>
      ) : (
        [...grouped.entries()].map(([ilceName, byMahalle]) => {
          const ilceCount = [...byMahalle.values()].reduce((acc, list) => acc + list.length, 0)
          return (
            <Card key={ilceName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-muted-foreground" />
                  {ilceName}
                  <Badge variant="outline" className="font-normal">
                    {ilceCount}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {[...byMahalle.entries()].map(([mahalleName, jobsInMahalle]) => (
                  <div key={mahalleName} className="flex flex-col gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground">{mahalleName}</h3>
                    <div className="flex flex-col gap-2">
                      {jobsInMahalle.map((job) => (
                        <div
                          key={job.id}
                          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {job.customer_name || job.phone}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {job.phone}
                              {job.requested_date ? (
                                <>
                                  {" · "}
                                  {formatDate(job.requested_date)}
                                  {job.requested_time ? ` · ${formatTime(job.requested_time)}` : ""}
                                </>
                              ) : job.requested_time ? (
                                ` · ${formatTime(job.requested_time)}`
                              ) : (
                                ""
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <YakamozStatusControl jobId={job.id} status={job.status} />
                            <YakamozJobRowActions job={job} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
