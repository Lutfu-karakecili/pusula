import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  coach: "/coach/dashboard",
  student: "/student/dashboard",
};

function isPathPublic(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/reset-password")
  );
}

function roleAllowedForPath(role: string, pathname: string) {
  if (role === "admin") return true;
  if (role === "coach") return pathname.startsWith("/coach");
  if (role === "student") return pathname.startsWith("/student");
  return false;
}

function redirectWithCookies(target: URL, cookieSource: NextResponse): NextResponse {
  const res = NextResponse.redirect(target);
  for (const c of cookieSource.cookies.getAll()) {
    res.cookies.set(c.name, c.value, c);
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    if (isPathPublic(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectWithCookies(url, supabaseResponse);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "student";

  if (isPathPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/student/dashboard";
    return redirectWithCookies(url, supabaseResponse);
  }

  if (pathname.startsWith("/dashboard") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/login";
    return redirectWithCookies(url, supabaseResponse);
  }

  if (!roleAllowedForPath(role, pathname) && !pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/login";
    return redirectWithCookies(url, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};