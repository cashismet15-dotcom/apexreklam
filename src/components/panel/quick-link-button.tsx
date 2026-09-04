"use client"

import { useState } from "react"
import { Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuickLinkDialog } from "@/components/panel/quick-link-dialog"

export function QuickLinkButton({
  customers,
}: {
  customers: { id: string; company_name: string }[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Link2 />
        Video Linki Ekle
      </Button>
      <QuickLinkDialog open={open} onOpenChange={setOpen} customers={customers} />
    </>
  )
}
