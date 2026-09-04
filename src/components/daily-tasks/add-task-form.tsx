"use client"

import { useActionState, useEffect, useRef } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addTask } from "@/lib/actions/daily-tasks"
import { initialActionState } from "@/lib/actions/shared"

export function AddTaskForm({ personId }: { personId: string }) {
  const action = addTask.bind(null, personId)
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2 px-4 py-2.5">
      <Input
        name="title"
        placeholder="Görev ekle..."
        required
        maxLength={200}
        className="h-7 shadow-none"
      />
      <Button type="submit" size="icon-sm" variant="ghost" disabled={isPending}>
        <Plus />
        <span className="sr-only">Görev ekle</span>
      </Button>
    </form>
  )
}
