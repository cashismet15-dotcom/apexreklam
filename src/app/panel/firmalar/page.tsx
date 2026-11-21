import Link from "next/link"
import { notFound } from "next/navigation"

import { AddFirmButton } from "@/components/firms/firm-buttons"
import { FirmCards } from "@/components/firms/firm-cards"
import { PageHeader } from "@/components/layout/page-header"
import { getSessionRole } from "@/lib/auth-role"
import { FIRM_STAGE_LABEL, OPEN_FIRM_STAGES } from "@/lib/firms"
import { getFirmStageCounts, getFirms } from "@/lib/firms-data"
import { canManageCustomers, canViewCustomers, toTeamRole } from "@/lib/panel"
import { cn } from "@/lib/utils"
import type { FirmStage } from "@/lib/types"

const TABS: { key: string; label: string; stages: FirmStage[] | undefined }[] = [
  { key: "takipte", label: "Takipte", stages: OPEN_FIRM_STAGES },
  { key: "ilk_gorusme", label: FIRM_STAGE_LABEL.ilk_gorusme, stages: ["ilk_gorusme"] },
  { key: "teklif_verildi", label: FIRM_STAGE_LABEL.teklif_verildi, stages: ["teklif_verildi"] },
  { key: "olumsuz", label: FIRM_STAGE_LABEL.olumsuz, stages: ["olumsuz"] },
  { key: "tumu", label: "Tümü", stages: undefined },
]

export default async function FirmalarPage({
  searchParams,
}: {
  searchParams: Promise<{ asama?: string }>
}) {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role || !canViewCustomers(role)) notFound()

  const { asama } = await searchParams
  const tab = TABS.find((t) => t.key === asama) ?? TABS[0]

  const [firms, counts] = await Promise.all([getFirms(tab.stages), getFirmStageCounts()])
  const countFor = (stages: FirmStage[] | undefined) =>
    (stages ?? (Object.keys(counts) as FirmStage[])).reduce((acc, s) => acc + counts[s], 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Firmalar"
        description="Tanıştığımız tüm mühendislik firmaları — İlk Görüşme → Teklif → Olumlu / Olumsuz."
        actions={canManageCustomers(role) ? <AddFirmButton /> : null}
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "takipte" ? "/panel/firmalar" : `/panel/firmalar?asama=${t.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              t.key === tab.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {t.label} <span className="opacity-70">{countFor(t.stages)}</span>
          </Link>
        ))}
        <Link
          href="/panel/musterilerimiz"
          className="rounded-full border border-emerald-200 px-3 py-1 text-sm text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          Olumlu → Müşterilerimiz <span className="opacity-70">{counts.olumlu}</span>
        </Link>
      </div>

      <FirmCards
        firms={firms}
        emptyLabel={tab.key === "takipte" ? "Takipte firma yok — yeni firma ekleyerek başla." : "Bu aşamada firma yok."}
      />
    </div>
  )
}
