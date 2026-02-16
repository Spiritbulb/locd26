import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/middleware'

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  '/',
  '/products',
  '/collections',
  '/cart',
  '/favourites',
  '/about',
  '/contact',
  '/search',
  '/reset-password',
  '/verify-email',
]

// Check if the path matches any public page (including dynamic routes)
function isPublicPage(pathname: string): boolean {
  // Exact match
  if (PUBLIC_PAGES.includes(pathname)) {
    return true
  }

  // Check for dynamic routes
  for (const page of PUBLIC_PAGES) {
    // Match /products/[id] style routes
    if (pathname.startsWith(`${page}/`) && page !== '/') {
      return true
    }
  }

  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public pages without authentication check
  if (isPublicPage(pathname)) {
    return NextResponse.next()
  }

  // For protected routes (like /account, /orders), check authentication
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}