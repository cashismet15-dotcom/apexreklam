import { formatCurrency, formatDate } from "@/lib/format"
import type { PartnerTransaction, PartnerTransactionType } from "@/lib/types"

const TYPE_LABELS: Record<PartnerTransactionType, string> = {
  topup: "Bakiye Yükleme",
  commission: "İş Komisyonu",
  adjustment: "Düzeltme",
}

export function TransactionList({ transactions }: { transactions: PartnerTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz işlem yok.</p>
  }

  return (
    <div className="flex flex-col divide-y">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div>
            <p className="font-medium">{TYPE_LABELS[tx.type]}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(tx.created_at)}
              {tx.status === "pending" ? " · Bekliyor" : tx.status === "failed" ? " · Başarısız" : ""}
            </p>
          </div>
          <p
            className={`font-medium tabular-nums ${
              tx.status !== "completed"
                ? "text-muted-foreground"
                : tx.amount >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
            }`}
          >
            {tx.amount >= 0 ? "+" : ""}
            {formatCurrency(tx.amount)}
          </p>
        </div>
      ))}
    </div>
  )
}
