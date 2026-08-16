"use client"

import { useActionState, useRef } from "react"
import { FileText, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { uploadPartnerTaxDocument } from "@/lib/actions/partner-companies"
import { initialActionState } from "@/lib/actions/shared"

export function TaxDocumentUpload({
  companyId,
  documentUrl,
}: {
  companyId: string
  documentUrl: string | null
}) {
  const action = uploadPartnerTaxDocument.bind(null, companyId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2">
      {documentUrl ? (
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <FileText className="size-4" />
          Yüklü vergi levhasını görüntüle
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">Henüz vergi levhası yüklenmedi.</p>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          name="tax_document"
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-fit"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {isPending ? "Yükleniyor..." : documentUrl ? "Değiştir" : "Vergi Levhası Yükle"}
        </Button>
        {state.status === "error" ? (
          <p className="text-xs text-destructive">{state.message}</p>
        ) : null}
      </form>
    </div>
  )
}
