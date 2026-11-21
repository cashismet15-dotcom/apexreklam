import { redirect } from "next/navigation"

// Potansiyel Müşteriler eski işletmeye ait — Muhasebe modülüne taşındı.
export default function EskiPotansiyelMusterilerPage() {
  redirect("/muhasebe/potansiyel-musteriler")
}
