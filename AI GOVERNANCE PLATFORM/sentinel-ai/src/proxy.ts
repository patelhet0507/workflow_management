import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/db"

const protectedRoutes = ["/", "/dashboard", "/agents", "/executions", "/activity", "/analytics", "/memory", "/security", "/policies", "/billing", "/settings", "/users", "/monitor"]

const rateLimitWindow = 60_000
const rateLimitMax = 100
const ipRequests = new Map<string, { count: number; resetAt: number }>()

function rateLimit(req: NextRequest): boolean {
  if (!req.nextUrl.pathname.startsWith("/api/")) return false
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local"
  const now = Date.now()
  const entry = ipRequests.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + rateLimitWindow })
    return false
  }
  entry.count++
  return entry.count > rateLimitMax
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (rateLimit(request)) {
    return new NextResponse("Too Many Requests", { status: 429 })
  }

  const isProtected = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))
  const isApi = pathname.startsWith("/api/")
  if (!isProtected && !isApi) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtected) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (user && pathname.startsWith("/users")) {
    const { data: userRecord } = await supabase.from("users").select("role").eq("auth_id", user.id).maybeSingle()
    if (userRecord?.role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
