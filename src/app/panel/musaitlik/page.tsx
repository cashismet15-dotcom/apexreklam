import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { AvailabilityForm } from "@/components/panel/availability-form"
import { BlockedDates } from "@/components/panel/blocked-dates"
import { QuickBlockDays } from "@/components/panel/quick-block-days"
import { getSessionRole } from "@/lib/auth-role"
import { toTeamRole } from "@/lib/panel"
import { getAvailability, getBlockedDates } from "@/lib/panel-data"

export default async function PanelMusaitlikPage() {
  const session = await getSessionRole()
  const role = session ? toTeamRole(session.role) : null
  if (!role) notFound()

  const [availability, blockedDates] = await Promise.all([
    getAvailability(role),
    getBlockedDates(role),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Müsaitlik"
        description={
          role === "owner"
            ? "apexhaliyikama.com.tr'deki randevu takvimi bu ayarlara göre çalışır."
            : "Kendi müsaitlik ayarların — apexhaliyikama.com.tr'deki randevu takvimini etkilemez, sadece İsmet'inki etkiler."
        }
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Haftalık Çalışma Saatleri</h2>
        <p className="text-xs text-muted-foreground">
          Bu ayarlar her hafta tekrarlanır — bir günü kapalı yaparsan, o gün her hafta kapalı
          sayılır. Sadece belirli bir tarihte (ör. bu hafta çarşamba) müsait değilsen, bunun
          yerine aşağıdaki <strong>Kapalı Günler</strong>&apos;i kullan.
        </p>
        <AvailabilityForm availability={availability} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Kapalı Günler</h2>
        <p className="text-xs text-muted-foreground">
          İşaretlediğin gün sadece o tarihte kapanır, diğer haftaları etkilemez.
        </p>
        <QuickBlockDays blockedDates={blockedDates.map((d) => d.blocked_date)} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Başka Bir Tarih İçin</h2>
        <p className="text-xs text-muted-foreground">
          7 günden daha ileri bir tarih ya da not eklemek istersen.
        </p>
        <BlockedDates dates={blockedDates} />
      </div>
    </div>
  )
}
