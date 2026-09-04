"use client"

import { useState } from "react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuickUploadDialog } from "@/components/panel/quick-upload-dialog"

export function QuickUploadButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Upload />
        Sunum Yükle
      </Button>
      <QuickUploadDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
