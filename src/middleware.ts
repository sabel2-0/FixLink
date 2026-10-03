import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const protectedPrefix = ['/app', '/tech', '/admin'].find((p) => path.startsWith(p))

  if (protectedPrefix && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && protectedPrefix) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // If the profile was deleted (admin removed the account), sign out immediately
    if (!profile) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('reason', 'account_removed')
      const response = NextResponse.redirect(loginUrl)
      // Clear Supabase auth cookies so the session is truly gone
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name)
        }
      }
      return response
    }

    const roleMap: Record<string, string> = {
      '/app': 'customer',
      '/tech': 'technician',
      '/admin': 'admin',
    }

    if (profile && profile.role !== roleMap[protectedPrefix]) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Block unverified technicians from /tech/*
    if (protectedPrefix === '/tech' && profile?.role === 'technician') {
      const { data: tech } = await supabase
        .from('technician_profiles')
        .select('cert_status')
        .eq('id', user.id)
        .single()

      if (tech?.cert_status !== 'verified') {
        return NextResponse.redirect(new URL('/registration-status', request.url))
      }
    }

    // Block unverified customers from /app/*
    if (protectedPrefix === '/app' && profile?.role === 'customer') {
      const { data: cust } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', user.id)
        .single()

      if (cust?.verification_status !== 'verified') {
        return NextResponse.redirect(new URL('/registration-status', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/app/:path*', '/tech/:path*', '/admin/:path*'],
}