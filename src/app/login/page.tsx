import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-semibold">
          A
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Apex İş Merkezi</h1>
        <p className="text-sm text-muted-foreground">Devam etmek için şifreni gir</p>
      </div>

      <LoginForm next={next} />
    </div>
  )
}
