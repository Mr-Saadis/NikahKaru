import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // 1. Update session (refreshes auth token if expired)
  const response = await updateSession(request);

  // 2. Check Auth Status for Routing reliably via Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith('/login');
  const isApiRoute = pathname.startsWith('/api');

  // Helper to preserve updated session cookies during redirects
  const createRedirect = (targetPath: string) => {
    const url = request.nextUrl.clone();
    if (targetPath.startsWith('/')) {
      url.pathname = targetPath;
      url.search = '';
    } else {
      const parsed = new URL(targetPath, request.url);
      url.pathname = parsed.pathname;
      url.search = parsed.search;
    }
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // 3. If user visits root '/', redirect them based on auth status
  if (pathname === '/') {
    if (user) {
      return createRedirect('/overview');
    } else {
      return createRedirect('/login');
    }
  }

  // 4. Protect all private routes (if NOT logged in, and NOT on login/api route -> redirect to login)
  if (!user && !isLoginRoute && !isApiRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return createRedirect(loginUrl.toString());
  }

  // 5. If already logged in and tries to access /login -> redirect to /overview
  if (user && isLoginRoute) {
    return createRedirect('/overview');
  }

  // 6. Protect Role Based Access Control Routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isProfilesRoute = pathname.startsWith('/profiles');
  const isDirectoryRoute = pathname.startsWith('/directory');
  const isRequestsRoute = pathname.startsWith('/requests');
  const isAgentRequestsRoute = pathname.startsWith('/agent-requests');

  const needsRoleCheck =
    isAdminRoute ||
    isProfilesRoute ||
    isDirectoryRoute ||
    isRequestsRoute ||
    isAgentRequestsRoute;

  if (user && needsRoleCheck) {
    // Fetch user role
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
      .single();

    // @ts-expect-error - Supabase nested relation typing
    const roleName = userRoleData?.role?.name?.toUpperCase() || '';

    // Admin-only route protection
    if (isAdminRoute && roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
      return createRedirect('/overview');
    }

    // Profiles page is for AGENT only (Manager & Admin use Directory)
    if (isProfilesRoute && (roleName === 'MANAGER' || roleName === 'HIGH_LEVEL_ADMIN')) {
      return createRedirect('/overview');
    }

    // Directory & Requests page are for MANAGER and ADMIN only (block AGENT)
    if ((isDirectoryRoute || isRequestsRoute) && roleName === 'AGENT') {
      return createRedirect('/overview');
    }

    // My Requests board is for AGENT only (block MANAGER and ADMIN)
    if (isAgentRequestsRoute && (roleName === 'MANAGER' || roleName === 'HIGH_LEVEL_ADMIN')) {
      return createRedirect('/overview');
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and fonts (svg, png, woff, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
