"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ISTANBUL_ILCELERI, YAKAMOZ_IL } from "@/lib/tr-locations"

export function YakamozFilterButton({ currentIlce }: { currentIlce?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [ilce, setIlce] = useState(currentIlce ?? "")

  function apply() {
    router.push(ilce ? `/yakamoz?ilce=${encodeURIComponent(ilce)}` : "/yakamoz")
    setOpen(false)
  }

  function clear() {
    setIlce("")
    router.push("/yakamoz")
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Filter />
        Filtrele
        {currentIlce ? ` · ${currentIlce}` : ""}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İl / İlçe Filtresi</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>İl</Label>
              <Select value={YAKAMOZ_IL} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={YAKAMOZ_IL}>{YAKAMOZ_IL}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-ilce">İlçe</Label>
              <Select value={ilce || undefined} onValueChange={setIlce}>
                <SelectTrigger id="filter-ilce" className="w-full">
                  <SelectValue placeholder="Tüm ilçeler" />
                </SelectTrigger>
                <SelectContent>
                  {ISTANBUL_ILCELERI.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={clear}>
              Temizle
            </Button>
            <Button type="button" onClick={apply}>
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
