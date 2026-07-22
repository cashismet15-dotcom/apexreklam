import Link from "next/link"

import { PageHeader } from "@/components/layout/page-header"
import { NewContactButton } from "@/components/crm/new-contact-button"
import { Card, CardContent } from "@/components/ui/card"
import { getCrmContacts } from "@/lib/crm-data"
import { formatDate } from "@/lib/format"

export default async function MusteriTakipPage() {
  const contacts = await getCrmContacts()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gelen Kutusu"
        description={`${contacts.length} kişi kayıtlı`}
        actions={<NewContactButton />}
      />

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y p-0">
          {contacts.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Henüz kayıtlı kişi yok. WhatsApp&apos;tan gelen mesajlar burada görünecek.
            </div>
          ) : (
            contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/musteri-takip/${contact.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {contact.name || contact.phone}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{contact.phone}</span>
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
