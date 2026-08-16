"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendYakamozBroadcast } from "@/lib/actions/yakamoz-broadcast"
import { initialActionState } from "@/lib/actions/shared"
import type { YakamozTemplate } from "@/lib/types"

export function YakamozBroadcastForm({
  templates,
  recipientCount,
}: {
  templates: YakamozTemplate[]
  recipientCount: number
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  const [resultOk, setResultOk] = useState(true)

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    setTitle(template.title)
    setBody(template.body)
  }

  function handleConfirmSend() {
    const formData = new FormData()
    formData.set("title", title)
    formData.set("body", body)
    startTransition(async () => {
      const res = await sendYakamozBroadcast(initialActionState, formData)
      setResult(res.message ?? null)
      setResultOk(res.status === "success")
      if (res.status === "success") {
        setConfirmOpen(false)
        setTitle("")
        setBody("")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {templates.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template">Hazır şablondan başla (opsiyonel)</Label>
          <Select onValueChange={applyTemplate}>
            <SelectTrigger id="template" className="w-full">
              <SelectValue placeholder="Şablon seç" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="broadcast-title">Başlık (sadece geçmişte görünür)</Label>
        <Input
          id="broadcast-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Ağustos Kampanyası"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="broadcast-body">Mesaj</Label>
        <Textarea
          id="broadcast-body"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Şablon seçebilir ya da buraya kendi mesajını yazabilirsin"
        />
        <span className="text-xs text-muted-foreground">
          Kişinin adını eklemek için <code>{"{{ad}}"}</code> yazabilirsin.
        </span>
      </div>

      {result ? (
        <p className={`text-sm ${resultOk ? "text-emerald-600" : "text-destructive"}`}>{result}</p>
      ) : null}

      <Button
        className="self-end"
        disabled={!body.trim() || recipientCount === 0}
        onClick={() => setConfirmOpen(true)}
      >
        {recipientCount} kişiye gönder
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={(next) => !isPending && setConfirmOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toplu mesaj gönderilsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Kayıtlı {recipientCount} kişiye bu mesaj WhatsApp üzerinden gönderilecek. Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{body}</div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmSend()
              }}
            >
              {isPending ? "Gönderiliyor..." : "Gönder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
