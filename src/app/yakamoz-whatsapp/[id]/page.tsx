import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { YakamozAiPauseToggle } from "@/components/yakamoz/yakamoz-ai-pause-toggle"
import { YakamozMessageThread } from "@/components/yakamoz/yakamoz-message-thread"
import { YakamozSendMessageForm } from "@/components/yakamoz/yakamoz-send-message-form"
import { getYakamozContactById, getYakamozMessages } from "@/lib/yakamoz-whatsapp-data"
import { formatDate } from "@/lib/format"

export default async function YakamozWhatsappContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getYakamozContactById(id)
  if (!contact) notFound()

  const messages = await getYakamozMessages(id)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/yakamoz-whatsapp"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Gelen kutusuna dön
      </Link>

      <PageHeader
        title={contact.name || contact.phone}
        description={`${contact.phone} · ilk kayıt ${formatDate(contact.created_at)}`}
        actions={<YakamozAiPauseToggle contactId={contact.id} aiPaused={contact.ai_paused} />}
      />

      <Card className="flex flex-col gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base font-semibold">Mesajlar</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <YakamozMessageThread messages={messages} />
        </CardContent>
        <div className="flex flex-col gap-3 border-t p-4">
          <YakamozSendMessageForm contactId={contact.id} phone={contact.phone} />
        </div>
      </Card>
    </div>
  )
}
