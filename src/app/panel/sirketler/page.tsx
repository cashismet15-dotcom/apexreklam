import { redirect } from "next/navigation"

// Eski işletmenin şirketleri Muhasebe > Müşteriler'de — Mühendis360'ta yok.
export default function EskiSirketlerPage() {
  redirect("/muhasebe/musteriler")
}
