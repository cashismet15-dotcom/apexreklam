import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { NewQuickReplyButton } from "@/components/crm/new-quick-reply-button"
import { QuickReplyRowActions } from "@/components/crm/quick-reply-row-actions"
import { getCrmQuickReplies } from "@/lib/crm-data"

export default async function CrmAyarlarPage() {
  const quickReplies = await getCrmQuickReplies()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ayarlar"
        description="Tek tıkla gönderilecek hazır yanıtları yönet (web sitesi, sosyal medya vb.)"
        actions={<NewQuickReplyButton />}
      />

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y p-0">
          {quickReplies.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Henüz hazır yanıt eklenmedi.
            </div>
          ) : (
            quickReplies.map((reply) => (
              <div key={reply.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{reply.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{reply.message}</span>
                </div>
                <QuickReplyRowActions quickReply={reply} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
