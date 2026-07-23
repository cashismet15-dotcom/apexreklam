"use client"

import { useActionState, useEffect, useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/shared/field-error"
import { Textarea } from "@/components/ui/textarea"
import { updateContentNotes } from "@/lib/actions/content"
import { initialActionState } from "@/lib/actions/shared"

export function ContentNotesDialog({
  customerId,
  companyName,
  notes,
}: {
  customerId: string
  companyName: string
  notes: string | null
}) {
  const [open, setOpen] = useState(false)
  const action = updateContentNotes.bind(null, customerId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        Talimatları Düzenle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{companyName} · Kalıcı Talimatlar</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Textarea
                id="content_notes"
                name="content_notes"
                rows={8}
                defaultValue={notes ?? ""}
                placeholder="Bu danışan için her hafta geçerli olan talimatlar, marka tonu, tercih ettiği video formatı vb..."
              />
              <FieldError errors={state.fieldErrors?.content_notes} />
            </div>

            {state.status === "error" && !state.fieldErrors ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
