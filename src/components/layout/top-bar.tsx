"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const bugununTarihi = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date())

export function TopBar({
  searchPlaceholder = "Müşteri veya ödeme ara...",
}: {
  searchPlaceholder?: string
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="h-8 bg-muted/40 pl-8 text-sm shadow-none"
        />
      </div>
      <div className="ml-auto hidden text-sm text-muted-foreground capitalize sm:block">
        {bugununTarihi}
      </div>
    </header>
  )
}
