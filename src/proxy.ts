import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Refresh the Supabase auth session on every request
  const response = await updateSession(request);

  const {
    nextUrl: { pathname },
  } = request;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback', '/auth/confirm'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // API routes — let them handle their own auth
  const isApiRoute = pathname.startsWith('/api/');

  // Static assets — always pass through
  const isStaticAsset =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico');

  if (isStaticAsset || isApiRoute) {
    return response;
  }

  // Check if user is authenticated via Supabase cookie
  // The updateSession already refreshed the token; we check the cookie presence
  const supabaseAuthToken = request.cookies.getAll().find(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  const isAuthenticated = !!supabaseAuthToken;

  // If user is NOT authenticated and trying to access a protected route
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user IS authenticated and trying to access login page — redirect to dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  // If user hits root "/" — redirect to overview
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/overview', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
