import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionValue } from "@/lib/session"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session.role === "huseyin" || session.role === "batuhan") {
    if (!pathname.startsWith("/panel")) {
      return NextResponse.redirect(new URL("/panel", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
