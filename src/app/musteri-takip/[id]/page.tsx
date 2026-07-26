import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactNotesForm } from "@/components/crm/contact-notes-form"
import { MessageThread } from "@/components/crm/message-thread"
import { QuickReplyButtons } from "@/components/crm/quick-reply-buttons"
import { SendMessageForm } from "@/components/crm/send-message-form"
import {
  getCrmContactById,
  getCrmContactNotes,
  getCrmMessages,
  getCrmQuickReplies,
} from "@/lib/crm-data"
import { formatDate } from "@/lib/format"

export default async function KisiDetayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getCrmContactById(id)
  if (!contact) notFound()

  const [messages, quickReplies, contactNotes] = await Promise.all([
    getCrmMessages(id),
    getCrmQuickReplies(),
    getCrmContactNotes(id),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/musteri-takip"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Gelen kutusuna dön
      </Link>

      <PageHeader
        title={contact.name || contact.phone}
        description={`${contact.phone}${contact.city ? ` · ${contact.city}` : ""} · ilk kayıt ${formatDate(contact.created_at)}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Not</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactNotesForm contactId={contact.id} notes={contactNotes} />
          </CardContent>
        </Card>

        <Card className="flex flex-col gap-0 py-0 lg:col-span-2">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base font-semibold">Mesajlar</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <MessageThread messages={messages} />
          </CardContent>
          <div className="flex flex-col gap-3 border-t p-4">
            <QuickReplyButtons
              contactId={contact.id}
              phone={contact.phone}
              quickReplies={quickReplies}
            />
            <SendMessageForm contactId={contact.id} phone={contact.phone} />
          </div>
        </Card>
      </div>
    </div>
  )
}
