import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { LogoutButton } from "@/components/auth/logout-button"
import { BalanceTopupForm } from "@/components/taseron/balance-topup-form"
import { PartnerProfileForm } from "@/components/taseron/partner-profile-form"
import { TaxDocumentUpload } from "@/components/taseron/tax-document-upload"
import { TransactionList } from "@/components/taseron/transaction-list"
import { getSessionRole } from "@/lib/auth-role"
import { getPartnerCompanyById, getPartnerTransactions } from "@/lib/partner-data"
import { formatCurrency } from "@/lib/format"

export default async function TaseronProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }>
}) {
  const [session, { topup }] = await Promise.all([getSessionRole(), searchParams])
  const [company, transactions] = await Promise.all([
    session?.companyId ? getPartnerCompanyById(session.companyId) : null,
    session?.companyId ? getPartnerTransactions(session.companyId) : Promise.resolve([]),
  ])

  if (!company) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Firma bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/taseron"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          İş Havuzu
        </Link>
        <LogoutButton />
      </div>

      {/* Marka kimliğiyle tutarlı "hero" bölümü — login sayfasındaki rozet deseni */}
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
          {company.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
        <p className="text-sm text-muted-foreground">Ufo Temizlik Taşeron Ortağı</p>
      </div>

      {topup === "success" ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" />
          Bakiye yüklemeniz başarıyla tamamlandı.
        </div>
      ) : topup === "failed" ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="size-4 shrink-0" />
          Ödeme tamamlanamadı, tekrar deneyebilirsin.
        </div>
      ) : null}

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Bakiyeniz</p>
            <p className="text-3xl font-semibold tabular-nums">{formatCurrency(company.balance)}</p>
          </div>

          <BalanceTopupForm />

          <div>
            <p className="mb-1 text-sm font-medium">Son İşlemler</p>
            <TransactionList transactions={transactions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm font-medium">Vergi Levhası</p>
          <TaxDocumentUpload companyId={company.id} documentUrl={company.tax_document_url} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm font-medium">Firma Bilgileri</p>
          <PartnerProfileForm company={company} />
        </CardContent>
      </Card>
    </div>
  )
}
