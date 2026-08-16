import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { NewYakamozTemplateButton } from "@/components/yakamoz/new-yakamoz-template-button"
import { YakamozTemplateRowActions } from "@/components/yakamoz/yakamoz-template-row-actions"
import { getYakamozTemplates } from "@/lib/yakamoz-broadcast-data"

export default async function YakamozSablonlarPage() {
  const templates = await getYakamozTemplates()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/yakamoz-haberlesme"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Yakamoz Haberleşme
      </Link>

      <PageHeader
        title="Şablonlar"
        description={`${templates.length} hazır mesaj şablonu`}
        actions={<NewYakamozTemplateButton />}
      />

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y p-0">
          {templates.length === 0 ? (
            <div className="flex h-24 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Henüz şablon yok.
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">{template.title}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{template.body}</span>
                </div>
                <YakamozTemplateRowActions template={template} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
