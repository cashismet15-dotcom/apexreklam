import { formatDate } from "@/lib/format"
import type { YakamozWaMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function YakamozMessageThread({ messages }: { messages: YakamozWaMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Henüz mesaj yok.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message) => {
        const isOutgoing = message.direction === "giden"
        return (
          <div
            key={message.id}
            className={cn("flex flex-col gap-1", isOutgoing ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-md rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                isOutgoing
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {message.body}
            </div>
            <span className="px-1 text-[11px] text-muted-foreground">
              {formatDate(message.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
