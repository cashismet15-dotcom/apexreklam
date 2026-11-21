import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { computeCollectionStatuses, type CustomerCollectionStatus } from "@/lib/collections"
import { getCustomers, getPayments } from "@/lib/data"
import { formatCurrency, formatDate, kalanGunEtiketi } from "@/lib/format"
import { cn } from "@/lib/utils"

function kalanGunBadgeClass(gun: number): string {
  if (gun < 0) return "bg-red-50 text-red-700 border-red-200"
  if (gun === 0) return "bg-amber-50 text-amber-700 border-amber-200"
  if (gun <= 3) return "bg-orange-50 text-orange-700 border-orange-200"
  return "bg-muted text-muted-foreground border-transparent"
}

function gunAnahtari(iso: string): string {
  return new Date(iso).toDateString()
}

function grupla(statuses: CustomerCollectionStatus[]): [string, CustomerCollectionStatus[]][] {
  const siralanmis = [...statuses].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  const gruplar = new Map<string, CustomerCollectionStatus[]>()
  for (const s of siralanmis) {
    const anahtar = gunAnahtari(s.dueDate)
    const mevcut = gruplar.get(anahtar) ?? []
    mevcut.push(s)
    gruplar.set(anahtar, mevcut)
  }
  return [...gruplar.entries()]
}

function GunGruplari({ gruplar }: { gruplar: [string, CustomerCollectionStatus[]][] }) {
  return (
    <div className="flex flex-col gap-4">
      {gruplar.map(([anahtar, kayitlar]) => {
        const ilkTarih = kayitlar[0].dueDate
        const gunToplam = kayitlar.reduce((acc, k) => acc + k.remainingThisMonth, 0)
        return (
          <div key={anahtar} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex shrink-0 flex-row items-baseline gap-2 pt-1 sm:w-40 sm:flex-col sm:items-start sm:gap-0.5">
              <span className="text-sm font-medium capitalize">{formatDate(ilkTarih)}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(gunToplam)} toplam
              </span>
            </div>
            <Card className="flex-1 gap-0 py-2">
              <CardContent className="flex flex-col divide-y px-0">
                {kayitlar.map((s) => (
                  <div
                    key={s.customer.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {s.customer.company_name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {s.customer.contact_name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(s.remainingThisMonth)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("font-normal", kalanGunBadgeClass(s.daysUntilDue))}
                      >
                        {kalanGunEtiketi(s.dueDate)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

export default async function TakvimPage() {
  const [customers, payments] = await Promise.all([getCustomers(), getPayments()])

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const bekleyenler = computeCollectionStatuses(customers, payments).filter(
    (s) => !s.isPaidThisMonth
  )

  const buAy = bekleyenler.filter((s) => {
    const d = new Date(s.dueDate)
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
  })
  const gelecekAy = bekleyenler.filter((s) => !buAy.includes(s))

  const buAyGruplari = grupla(buAy)
  const gelecekAyGruplari = grupla(gelecekAy)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Takvim"
        description="Ödemesi bekleyen ve geciken müşteriler, vade gününe göre"
      />

      {bekleyenler.length === 0 ? (
        <Card className="py-10">
          <CardContent className="text-center text-sm text-muted-foreground">
            Herkes ödemesini yaptı.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Bu Ay</h2>
            {buAyGruplari.length === 0 ? (
              <Card className="py-6">
                <CardContent className="text-center text-sm text-muted-foreground">
                  Bu ay herkes ödemesini yaptı.
                </CardContent>
              </Card>
            ) : (
              <GunGruplari gruplar={buAyGruplari} />
            )}
          </div>

          {gelecekAyGruplari.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Gelecek Ay</h2>
              <GunGruplari gruplar={gelecekAyGruplari} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
