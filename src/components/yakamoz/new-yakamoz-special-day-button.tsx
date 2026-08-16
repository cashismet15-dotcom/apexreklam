"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { YakamozSpecialDayFormDialog } from "@/components/yakamoz/yakamoz-special-day-form-dialog"
import type { YakamozTemplate } from "@/lib/types"

export function NewYakamozSpecialDayButton({ templates }: { templates: YakamozTemplate[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        Özel Gün Ekle
      </Button>
      <YakamozSpecialDayFormDialog open={open} onOpenChange={setOpen} templates={templates} />
    </>
  )
}
