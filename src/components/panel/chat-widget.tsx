"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, RefreshCw, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendPanelMessage } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"
import { TEAM_MEMBER_LABEL, formatTimeTr } from "@/lib/panel"
import type { PanelMessage, TeamMemberRole } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ChatWidget({
  messages,
  currentRole,
}: {
  messages: PanelMessage[]
  currentRole: TeamMemberRole
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(sendPanelMessage, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset()
  }, [state])

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [open, messages.length])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="size-5" />
        <span className="sr-only">Ekip sohbetini aç</span>
      </button>
    )
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex h-[420px] w-80 flex-col overflow-hidden rounded-xl border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold">Ekip Sohbeti</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            <span className="sr-only">Yenile</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
            <span className="sr-only">Kapat</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">Henüz mesaj yok.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.author === currentRole
            return (
              <div
                key={m.id}
                className={cn("flex max-w-[85%] flex-col", isMine ? "self-end items-end" : "self-start items-start")}
              >
                <span className="text-[10px] text-muted-foreground">
                  {TEAM_MEMBER_LABEL[m.author]} · {formatTimeTr(m.created_at)}
                </span>
                <div
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-sm break-words",
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {m.body}
                </div>
              </div>
            )
          })
        )}
      </div>

      <form ref={formRef} action={formAction} className="flex items-center gap-1.5 border-t p-2">
        <Input name="body" placeholder="Mesaj yaz..." className="h-8" required maxLength={1000} />
        <Button type="submit" size="icon-sm" disabled={isPending}>
          <Send className="size-3.5" />
          <span className="sr-only">Gönder</span>
        </Button>
      </form>
    </div>
  )
}
