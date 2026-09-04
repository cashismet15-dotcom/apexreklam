import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

export function TeamAvatar({
  label,
  url,
  className,
}: {
  label: string
  url: string | null
  className?: string
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarImage src={url ?? undefined} alt={label} />
      <AvatarFallback>{initials(label)}</AvatarFallback>
    </Avatar>
  )
}
