"use client"

import { useActionState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/shared/field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClientTask } from "@/lib/actions/panel"
import { initialActionState } from "@/lib/actions/shared"
import { TASK_CATEGORIES, TASK_CATEGORY_LABEL, TEAM_MEMBERS } from "@/lib/panel"
import type { TeamMemberRole } from "@/lib/types"

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null ise genel/dahili bir görev oluşturulur — belirli bir müşteriye bağlı değil. */
  customerId: string | null
  defaultAssignee: TeamMemberRole
  /** Bir nottan/mesajdan "Görev Ata" ile açıldığında başlığı önceden doldurur. */
  defaultTitle?: string
}

export function TaskFormDialog({
  open,
  onOpenChange,
  customerId,
  defaultAssignee,
  defaultTitle,
}: TaskFormDialogProps) {
  const action = createClientTask.bind(null, customerId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Görev Ekle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              name="title"
              placeholder="örn. Eylül ayı reklam güncellemesi"
              defaultValue={defaultTitle}
              required
            />
            <FieldError errors={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" name="description" rows={3} />
            <FieldError errors={state.fieldErrors?.description} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Kategori</Label>
              <Select name="category" defaultValue="diger">
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TASK_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assigned_to">Kime Atanacak</Label>
              <Select name="assigned_to" defaultValue={defaultAssignee}>
                <SelectTrigger id="assigned_to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBERS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="due_date">Son Tarih (opsiyonel)</Label>
            <Input id="due_date" name="due_date" type="date" />
            <FieldError errors={state.fieldErrors?.due_date} />
          </div>

          {state.status === "error" && !state.fieldErrors ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
