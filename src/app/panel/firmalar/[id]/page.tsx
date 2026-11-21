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
import {
  getCustomerForFirm,
  getFirmById,
  getFirmNotes,
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

  const [notes, firmServices, services, customer] = await Promise.all([
    getFirmNotes(id),
    getFirmServices(id),
    isOwner ? getServices(true) : Promise.resolve([]),
    isOwner ? getCustomerForFirm(id) : Promise.resolve(null),
  ])

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
              defaultStartDate={addDaysIso(todayIso(), DEFAULT_START_DELAY_DAYS)}
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
                <FirmServiceList items={firmServices} showAmounts={isOwner} />
                {isOwner && customer ? (
                  <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-xs">
                    <span>
                      Muhasebe: {formatCurrency(customer.monthly_fee)}/ay · her ayın{" "}
                      {customer.payment_day}&apos;i
                    </span>
                    <Link
                      href={`/muhasebe/musteriler/${customer.id}`}
                      className="text-primary hover:underline"
                    >
                      Ödeme geçmişini gör →
                    </Link>
                  </div>
                ) : null}
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
