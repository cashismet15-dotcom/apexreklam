"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { sendQuickReply } from "@/lib/actions/crm"
import type { CrmQuickReply } from "@/lib/types"

export function QuickReplyButtons({
  contactId,
  phone,
  quickReplies,
}: {
  contactId: string
  phone: string
  quickReplies: CrmQuickReply[]
}) {
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (quickReplies.length === 0) {
    return null
  }

  function handleClick(id: string) {
    setError(null)
    setPendingId(id)
    startTransition(async () => {
      const result = await sendQuickReply(contactId, phone, id)
      if (result.status === "error") {
        setError(result.message ?? "Gönderilemedi.")
      }
      setPendingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {quickReplies.map((reply) => (
          <Button
            key={reply.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleClick(reply.id)}
          >
            {pendingId === reply.id ? "Gönderiliyor..." : reply.title}
          </Button>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
