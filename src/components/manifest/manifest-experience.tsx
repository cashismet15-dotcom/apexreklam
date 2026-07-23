"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { formatCurrency } from "@/lib/format"

const PRINCIPLES = [
  "Kibri bırak",
  "Güler yüzlü ol",
  "Ağzını kapat",
  "Yüksek sesle konuş",
  "Spor yap",
  "Sakin ol",
  "Sağlıklı ol",
  "Disiplinli ol",
  "Etki alanına odaklan",
  "Allah'a inan, O senin içinde",
  "Şartları bırak, olacak olanı biliyorsun",
  "Oyunun dışına çık",
  "İnan ve güven",
  "Tetiklenme",
  "Değersizlik yok",
  "Kıtlık yok",
  "Kaybetmek yok",
  "Korku yok",
  "Aşk, sevgi, güven, inanç var",
  "Kendine inan",
]

const AFFIRMATIONS = [
  "20 danışan olacaksın",
  "Aylık 200K kazanacağım",
  "Disiplinli bir insanım",
  "Vücudum 10 numara sağlam ve sağlıklıyım",
  "Tüm insanlarla iyi geçiniyorum",
  "Pozitif bir insanım",
  "Hayatımdaki tüm sorunları atlatabilirim",
  "Zaten olmuş ve olacakmış gibi davran",
  "Bali'de bu işi yaparken tatil yapacağım",
  "Mutlu ol",
  "Ve bunların hepsini hatırla",
]

const GOAL_CUSTOMERS = 20
const COIN_EMOJIS = ["💰", "🪙", "✨", "💵"]

interface Particle {
  left: number
  delay: number
  duration: number
  size: number
  emoji: string
}

function useCountUp(target: number, durationMs = 1800) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf: number
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

export function ManifestExperience({
  totalRevenue,
  activeCustomerCount,
}: {
  totalRevenue: number
  activeCustomerCount: number
}) {
  const displayedRevenue = useCountUp(totalRevenue)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 5,
        size: 16 + Math.random() * 18,
        emoji: COIN_EMOJIS[Math.floor(Math.random() * COIN_EMOJIS.length)],
      }))
    )
  }, [])

  const progressPct = Math.min(100, Math.round((activeCustomerCount / GOAL_CUSTOMERS) * 100))

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#1a1408_0%,_#0a0805_45%,_#000000_100%)] text-amber-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="manifest-particle absolute bottom-0 opacity-0"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationName: "manifest-float-up",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in",
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <Link
        href="/"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-black/30 px-3 py-1.5 text-xs text-amber-200/80 backdrop-blur transition-colors hover:border-amber-400/40 hover:text-amber-100"
      >
        <ArrowLeft className="size-3.5" />
        Ana Sayfa
      </Link>

      <div className="relative z-10 flex flex-col items-center gap-16 px-4 py-20 sm:py-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="animate-in fade-in text-xs font-medium tracking-[0.3em] text-amber-400/70 uppercase duration-1000">
            Şimdiye Kadarki Ciro
          </span>
          <div className="relative">
            <div className="manifest-glow absolute inset-0 -z-10 rounded-full bg-amber-500/30 blur-3xl [animation:manifest-glow-pulse_3s_ease-in-out_infinite]" />
            <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent tabular-nums drop-shadow-[0_0_40px_rgba(251,191,36,0.35)] sm:text-7xl">
              {formatCurrency(displayedRevenue)}
            </span>
          </div>

          <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-amber-200/70">
              <span>{activeCustomerCount} danışan</span>
              <span>Hedef: {GOAL_CUSTOMERS}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-950/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-1000 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <section className="flex w-full max-w-3xl flex-col items-center gap-6">
          <h2 className="animate-in fade-in text-sm font-semibold tracking-[0.3em] text-amber-400/60 uppercase duration-1000">
            İlkeler
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
            {PRINCIPLES.map((p, i) => (
              <span
                key={p}
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
                className="animate-in fade-in slide-in-from-bottom-2 rounded-full border border-amber-400/15 bg-amber-400/5 px-4 py-1.5 text-sm text-amber-100/90 duration-700"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        <section className="flex w-full max-w-2xl flex-col items-center gap-6 pb-12">
          <h2 className="animate-in fade-in text-sm font-semibold tracking-[0.3em] text-amber-400/60 uppercase duration-1000">
            Telkinlerim
          </h2>
          <div className="flex flex-col items-center gap-3">
            {AFFIRMATIONS.map((a, i) => (
              <p
                key={a}
                style={{ animationDelay: `${400 + i * 120}ms`, animationFillMode: "backwards" }}
                className="animate-in fade-in slide-in-from-bottom-3 text-center text-lg font-medium text-amber-50 duration-700 sm:text-xl"
              >
                {a}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
