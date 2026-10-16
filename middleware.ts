import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session and, if the refresh token is dead, wipe the stale
  // cookies so the next request starts clean instead of logging the same
  // AuthApiError forever.
  try {
    const { error } = await supabase.auth.getUser()
    if (error && /Refresh Token/i.test(error.message)) {
      // Stale cookie - clear it without a round trip to Supabase
      for (const c of request.cookies.getAll()) {
        if (c.name.startsWith("sb-")) {
          response.cookies.set(c.name, "", { maxAge: 0, path: "/" })
        }
      }
    }
  } catch {
    // Never let a Supabase hiccup hang the request. The page still renders;
    // the client-side provider will re-check the session on hydrate.
  }

  return response
}

export const config = {
  matcher: [
    // Skip static assets, images, and the favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}