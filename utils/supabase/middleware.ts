import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, redirect authenticated routes to sign-in
    if (!user) {
      const url = request.nextUrl.pathname;
      if (url.startsWith('/client/') || url.startsWith('/therapist/')) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      return response;
    }

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Handle role-based routing
    const url = request.nextUrl.pathname;

    // Redirect from root to appropriate dashboard
    if (url === '/') {
      return NextResponse.redirect(
        new URL(role === 'client' ? '/client/dashboard' : '/therapist/dashboard', request.url)
      );
    }

    // Prevent clients from accessing therapist routes and vice versa
    if (role === 'client' && url.startsWith('/therapist/')) {
      return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }

    if (role === 'therapist' && url.startsWith('/client/')) {
      return NextResponse.redirect(new URL('/therapist/dashboard', request.url));
    }

    // Prevent authenticated users from accessing auth pages
    if (user && (url === '/sign-in' || url === '/sign-up')) {
      return NextResponse.redirect(
        new URL(role === 'client' ? '/client/dashboard' : '/therapist/dashboard', request.url)
      );
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
