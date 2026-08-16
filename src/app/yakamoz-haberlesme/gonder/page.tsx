import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { YakamozBroadcastForm } from "@/components/yakamoz/yakamoz-broadcast-form"
import { getYakamozJobs } from "@/lib/yakamoz-data"
import { getYakamozContacts } from "@/lib/yakamoz-whatsapp-data"
import { getYakamozTemplates } from "@/lib/yakamoz-broadcast-data"
import { getYakamozAllRecipients } from "@/lib/yakamoz"

export default async function YakamozGonderPage() {
  const [jobs, contacts, templates] = await Promise.all([
    getYakamozJobs(),
    getYakamozContacts(),
    getYakamozTemplates(),
  ])

  const recipientCount = getYakamozAllRecipients(jobs, contacts).length

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/yakamoz-haberlesme"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Yakamoz Haberleşme
      </Link>

      <PageHeader
        title="Toplu Mesaj Gönder"
        description={`Kayıtlı ${recipientCount} kişinin tamamına WhatsApp mesajı gönderilir.`}
      />

      <Card>
        <CardContent>
          <YakamozBroadcastForm templates={templates} recipientCount={recipientCount} />
        </CardContent>
      </Card>
    </div>
  )
}
