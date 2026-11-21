import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Globe, MapPin, MessageCircle, Phone, User } from "lucide-react"

import { DeleteFirmButton, EditFirmButton } from "@/components/firms/firm-buttons"
import { FirmNotes } from "@/components/firms/firm-notes"
import { FirmServiceList } from "@/components/firms/firm-service-list"
import { FirmStageControl } from "@/components/firms/firm-stage-control"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionRole } from "@/lib/auth-role"
import { addDaysIso, todayIso } from "@/lib/daily-tracker"
import {
  DEFAULT_START_DELAY_DAYS,
  FIRM_STAGE_LABEL,
  FIRM_STAGE_STYLE,
  toExternalUrl,
  toWhatsappNumber,
} from "@/lib/firms"
import { FirmPaymentList, RecordPaymentButton } from "@/components/muhasebe/firm-payments"
import { buildMonthEvents, monthlyFeeOf, outstandingEvents, paymentOptionsFor } from "@/lib/calendar"
import {
  getFirmById,
  getFirmNotes,
  getFirmPayments,
  getFirmServices,
  getServices,
} from "@/lib/firms-data"
import { formatCurrency, formatDate } from "@/lib/format"
import { canManageCustomers, canViewCustomers, toTeamRole } from "@/lib/panel"
import { cn } from "@/lib/utils"

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right break-words">{children}</span>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  )
}

export default async function FirmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role || !canViewCustomers(role)) notFound()

  const firm = await getFirmById(id)
  if (!firm) notFound()

  const isOwner = role === "owner"
  const canEdit = canManageCustomers(role)

  const [notes, firmServices, services, payments] = await Promise.all([
    getFirmNotes(id),
    getFirmServices(id),
    isOwner ? getServices(true) : Promise.resolve([]),
    isOwner ? getFirmPayments(id) : Promise.resolve([]),
  ])

  // Mühendis360 muhasebesi — bu ayın durumu, borç dökümü ve ödeme seçenekleri.
  const today = todayIso()
  const billingFirm = { firm, services: firmServices, payments }
  const monthlyFee = monthlyFeeOf(firmServices)
  const thisMonth = buildMonthEvents({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
    todayIso: today,
    firms: [billingFirm],
    // Söz verilen tarihi bu aya kaymış eski ay borçları değil, bu ayın kendi ücreti.
  }).find((e) => e.kind === "aylik" && e.period === today.slice(0, 7))
  const openItems = outstandingEvents([billingFirm], today)
  const overdueTotal = openItems.filter((e) => e.dateIso < today).reduce((acc, e) => acc + e.remaining, 0)
  const openTotal = openItems.reduce((acc, e) => acc + e.remaining, 0)
  const paymentOptions = paymentOptionsFor(openItems)
  const serviceNames = Object.fromEntries(firmServices.map((s) => [s.id, s.name]))
  const paidByService: Record<string, number> = {}
  for (const pay of payments) {
    if (pay.firm_service_id) {
      paidByService[pay.firm_service_id] = (paidByService[pay.firm_service_id] ?? 0) + Number(pay.amount)
    }
  }

  const socials = [
    { label: "Instagram", value: firm.instagram, base: "https://instagram.com/" },
    { label: "LinkedIn", value: firm.linkedin, base: undefined },
    { label: "Facebook", value: firm.facebook, base: "https://facebook.com/" },
  ].filter((s) => s.value)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        href={firm.stage === "olumlu" ? "/panel/musterilerimiz" : "/panel/firmalar"}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {firm.stage === "olumlu" ? "Müşterilerimiz'e dön" : "Firmalar'a dön"}
      </Link>

      <PageHeader
        title={firm.name}
        description={[firm.city, firm.contact_name].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <Badge variant="outline" className={cn(FIRM_STAGE_STYLE[firm.stage])}>
              {FIRM_STAGE_LABEL[firm.stage]}
            </Badge>
            {firm.phone ? (
              <a
                href={`https://wa.me/${toWhatsappNumber(firm.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-muted"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            ) : null}
            {canEdit ? <EditFirmButton firm={firm} /> : null}
            {isOwner ? <DeleteFirmButton firmId={firm.id} firmName={firm.name} /> : null}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Süreç</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <FirmStageControl
              firmId={firm.id}
              stage={firm.stage}
              services={services}
              canConvert={isOwner}
              defaultStartDate={addDaysIso(today, DEFAULT_START_DELAY_DAYS)}
            />
          ) : (
            <span className="text-sm">{FIRM_STAGE_LABEL[firm.stage]}</span>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Firma Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-sm">
              <InfoRow label="Yetkili">
                {firm.contact_name ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3.5 text-muted-foreground" />
                    {firm.contact_name}
                  </span>
                ) : "—"}
              </InfoRow>
              <InfoRow label="Telefon">
                {firm.phone ? (
                  <a href={`tel:${firm.phone}`} className="inline-flex items-center gap-1 hover:underline">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {firm.phone}
                  </a>
                ) : "—"}
              </InfoRow>
              <InfoRow label="Şehir">
                {firm.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    {firm.city}
                  </span>
                ) : "—"}
              </InfoRow>
              <InfoRow label="Web Sitesi">
                {firm.website ? (
                  <ExternalLink href={toExternalUrl(firm.website)}>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="size-3.5" />
                      {firm.website.replace(/^https?:\/\//, "")}
                    </span>
                  </ExternalLink>
                ) : "—"}
              </InfoRow>
              {socials.map((s) => (
                <InfoRow key={s.label} label={s.label}>
                  <ExternalLink href={toExternalUrl(s.value!, s.base)}>
                    {s.value!.replace(/^https?:\/\/(www\.)?/, "")}
                  </ExternalLink>
                </InfoRow>
              ))}
              <InfoRow label="Eklendi">{formatDate(firm.created_at)}</InfoRow>
              {firm.firm_services ? (
                <div className="mt-2 flex flex-col gap-1 border-t pt-3">
                  <span className="text-muted-foreground">Firmanın Hizmetleri</span>
                  <p className="whitespace-pre-wrap">{firm.firm_services}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {firm.stage === "olumlu" || firmServices.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aldığı Hizmetler</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <FirmServiceList items={firmServices} showAmounts={isOwner} paidByService={paidByService} />
              </CardContent>
            </Card>
          ) : null}

          {isOwner && firm.billing_start ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ödemeler ve Borç</CardTitle>
                {paymentOptions.length > 0 || monthlyFee > 0 ? (
                  <CardAction>
                    <RecordPaymentButton
                      firmId={firm.id}
                      firmName={firm.name}
                      options={paymentOptions}
                      hasMonthly={monthlyFee > 0}
                      todayIso={today}
                    />
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 text-sm">
                  {monthlyFee > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aylık ücret</span>
                      <span className="font-medium">
                        {formatCurrency(monthlyFee)} · her ayın {firm.payment_day}&apos;i
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İlk ödeme</span>
                    <span>{formatDate(firm.billing_start)}</span>
                  </div>
                  {thisMonth ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bu ay</span>
                      <span
                        className={cn(
                          "font-medium",
                          thisMonth.status === "odendi" && "text-emerald-700 dark:text-emerald-400",
                          thisMonth.status === "gecikti" && "text-red-700 dark:text-red-400",
                          (thisMonth.status === "bekliyor" || thisMonth.status === "kismi") &&
                            "text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {thisMonth.status === "odendi"
                          ? "Ödendi"
                          : `${formatCurrency(thisMonth.remaining)} ${thisMonth.status === "gecikti" ? "gecikti" : "bekliyor"} · ${formatDate(thisMonth.dateIso)}`}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-1 flex justify-between border-t pt-2">
                    <span className="font-medium">Toplam borç</span>
                    <span
                      className={cn(
                        "font-semibold",
                        openTotal > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {openTotal > 0 ? formatCurrency(openTotal) : "Borcu yok"}
                    </span>
                  </div>
                  {overdueTotal > 0 && overdueTotal !== openTotal ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Vadesi geçmiş</span>
                      <span className="font-medium text-red-700 dark:text-red-400">{formatCurrency(overdueTotal)}</span>
                    </div>
                  ) : null}
                </div>

                {openItems.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Borç Dökümü</span>
                    <div className="flex flex-col divide-y">
                      {openItems.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{e.kind === "aylik" ? e.label : `${e.label} (tek seferlik)`}</span>
                            <span className="text-xs text-muted-foreground">
                              {e.dateIso !== e.originalDateIso
                                ? `söz verilen: ${formatDate(e.dateIso)} · asıl vade ${formatDate(e.originalDateIso)}`
                                : `vade ${formatDate(e.dateIso)}`}
                              {e.paid > 0 ? ` · ${formatCurrency(e.paid)} alındı` : ""}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-semibold tabular-nums",
                              e.status === "gecikti" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {formatCurrency(e.remaining)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Ödeme Geçmişi</span>
                  <FirmPaymentList payments={payments} serviceNames={serviceNames} />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hakkında / İlk Tanışma Görüşmesi</CardTitle>
              {canEdit ? (
                <CardAction>
                  <EditFirmButton firm={firm} />
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              {firm.about ? (
                <p className="whitespace-pre-wrap text-sm">{firm.about}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Henüz yazılmadı — ilk görüşmede konuşulanları &quot;Düzenle&quot;den ekleyebilirsin.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notlar {notes.length > 0 ? `(${notes.length})` : ""}</CardTitle>
            </CardHeader>
            <CardContent>
              <FirmNotes firmId={firm.id} notes={notes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
