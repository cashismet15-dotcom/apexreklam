"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { takePartnerJob } from "@/lib/actions/partner"
import { PARTNER_TERMS_TEXT } from "@/lib/partner-terms"

export function TakeJobButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await takePartnerJob(jobId)
      if (result.status === "error") {
        setError(result.message ?? "Bir hata oluştu.")
        return
      }
      setOpen(false)
    })
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" onClick={() => setOpen(true)}>
          İşi Al
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) {
            setOpen(next)
            if (!next) setAccepted(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sorumluluk Sözleşmesi</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto whitespace-pre-line rounded-md border p-3 text-sm text-muted-foreground">
            {PARTNER_TERMS_TEXT}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <Label htmlFor="accept-terms">Şartları okudum ve kabul ediyorum</Label>
            <Switch id="accept-terms" checked={accepted} onCheckedChange={setAccepted} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Vazgeç
            </Button>
            <Button type="button" disabled={!accepted || isPending} onClick={handleConfirm}>
              {isPending ? "Alınıyor..." : "Onayla ve İşi Al"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
