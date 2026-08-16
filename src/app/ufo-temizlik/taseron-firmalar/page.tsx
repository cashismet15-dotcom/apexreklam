import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LogoutButton } from "@/components/auth/logout-button"
import { NewPartnerCompanyButton } from "@/components/taseron/new-partner-company-button"
import { PartnerCompanyRowActions } from "@/components/taseron/partner-company-row-actions"
import { getPartnerCompanies } from "@/lib/partner-data"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function TaseronFirmalarPage() {
  const companies = await getPartnerCompanies()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/ufo-temizlik"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Ufo Temizlik
        </Link>
        <LogoutButton />
      </div>

      <PageHeader
        title="Taşeron Firmalar"
        description="Alt firma hesapları — bu firmalar sadece 'Alt Firmaya Aç' işaretli işleri görebilir."
        actions={<NewPartnerCompanyButton />}
      />

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Firma</TableHead>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Bakiye</TableHead>
                <TableHead>Puan</TableHead>
                <TableHead>Vergi Levhası</TableHead>
                <TableHead>Eklenme</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    Henüz taşeron firma yok.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-sm font-medium">{company.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          company.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-normal"
                            : "bg-red-50 text-red-700 border-red-200 font-normal"
                        }
                      >
                        {company.active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatCurrency(company.balance)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.avg_rating != null
                        ? `${company.avg_rating.toFixed(1)} (${company.rating_count} iş)`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {company.tax_document_url ? (
                        <a
                          href={company.tax_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Görüntüle
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(company.created_at)}
                    </TableCell>
                    <TableCell>
                      <PartnerCompanyRowActions company={company} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
