import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm" className={className}>
        <LogOut />
        Çıkış Yap
      </Button>
    </form>
  )
}
