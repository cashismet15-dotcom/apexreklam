import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { LogoutButton } from "@/components/auth/logout-button"
import { getSessionRole } from "@/lib/auth-role"
import { getYakamozContacts } from "@/lib/yakamoz-whatsapp-data"
import { formatDate } from "@/lib/format"

export default async function YakamozWhatsappPage() {
  const [contacts, session] = await Promise.all([getYakamozContacts(), getSessionRole()])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/yakamoz"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Yakamoz
        </Link>
        {session?.role === "owner" ? <LogoutButton /> : <span />}
      </div>

      <PageHeader
        title="Yakamoz WhatsApp"
        description={`${contacts.length} kişi kayıtlı`}
      />

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y p-0">
          {contacts.length === 0 ? (
            <div className="flex h-24 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Henüz kayıtlı konuşma yok. WhatsApp&apos;tan gelen mesajlar burada görünecek.
            </div>
          ) : (
            contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/yakamoz/whatsapp/${contact.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {contact.name || contact.phone}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {contact.phone}
                    {contact.ai_paused ? " · YZ duraklatıldı" : ""}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {contact.last_message_at ? formatDate(contact.last_message_at) : "—"}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
