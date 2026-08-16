import Link from "next/link"
import { Clapperboard, Droplets, Sparkles, SprayCan, Users, Wallet } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"

const apps = [
  {
    title: "Muhasebe",
    description: "Aylık tahsilat, müşteri ve ödeme takibi.",
    href: "/muhasebe",
    icon: Wallet,
  },
  {
    title: "Müşteri Takip",
    description: "CRM — müşteri ilişkileri ve iletişim takibi.",
    href: "/musteri-takip",
    icon: Users,
  },
  {
    title: "İçerik Takibi",
    description: "Danışan bazlı haftalık video süreci, logo ve talimatlar.",
    href: "/icerik-takip",
    icon: Clapperboard,
  },
  {
    title: "Manifest",
    description: "Modun, ilkelerin ve telkinlerin — girdikçe büyüyen ciro sayacı.",
    href: "/manifest",
    icon: Sparkles,
  },
  {
    title: "Ufo Temizlik",
    description: "Ev temizliği ve koltuk yıkama iş & ciro takibi.",
    href: "/ufo-temizlik",
    icon: SprayCan,
  },
  {
    title: "Yakamoz Halı Yıkama",
    description: "Müşteri, randevu ve kurye/servis takibi.",
    href: "/yakamoz",
    icon: Droplets,
  },
]

export default function AnaSayfa() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
      <LogoutButton className="absolute top-4 right-4" />
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-semibold">
          A
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Apex İş Merkezi</h1>
        <p className="text-sm text-muted-foreground">Devam etmek için bir uygulama seç</p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="group flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <app.icon className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">{app.title}</span>
              <span className="text-sm text-muted-foreground">{app.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
