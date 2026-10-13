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
        setAll() {
          // Handled by updateSession
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  // If user visits root '/', redirect them based on auth status
  if (request.nextUrl.pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/overview', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect all private routes (if NOT logged in, and NOT on login/api route -> redirect to login)
  if (!user && !isLoginRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Protect Role Based Access Control Routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isProfilesRoute = request.nextUrl.pathname.startsWith('/profiles') || request.nextUrl.pathname.startsWith('/add-profile');

  if (user && (isAdminRoute || isProfilesRoute)) {
    // Fetch user role
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
      .single();

    // @ts-ignore - Supabase types might complain about nested selection
    const roleName = userRoleData?.role?.name;
    
    if (isAdminRoute && roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
      // If not an admin, redirect to dashboard overview
      const url = request.nextUrl.clone();
      url.pathname = '/overview';
      return NextResponse.redirect(url);
    }

    if (isProfilesRoute && (roleName === 'MANAGER' || roleName === 'HIGH_LEVEL_ADMIN')) {
      // Manager and High Level Admin cannot access profile page
      const url = request.nextUrl.clone();
      url.pathname = '/overview';
      return NextResponse.redirect(url);
    }
  }

  // If already logged in and tries to access /login -> redirect to /overview
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/overview';
    return NextResponse.redirect(url);
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
