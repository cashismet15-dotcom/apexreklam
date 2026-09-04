import { Badge } from "@/components/ui/badge"
import type { CustomerCollectionStatus } from "@/lib/collections"
import { needsBillingSetup } from "@/lib/panel"

export function PaymentStatusBadge({ status }: { status: CustomerCollectionStatus }) {
  if (needsBillingSetup(status.customer)) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-normal">
        Ücret Ayarlanmadı
      </Badge>
    )
  }
  if (status.isPaidThisMonth) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
        Ödendi
      </Badge>
    )
  }
  if (status.isOverdue) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal">
        Gecikti
      </Badge>
    )
  }
  if (status.isPartiallyPaid) {
    return (
      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 font-normal">
        Kısmi Ödendi
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">
      Bekliyor
    </Badge>
  )
}
