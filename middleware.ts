import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback", "/reset-password"];

// Rol -> varsayılan/izinli dashboard kök yolu
const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  coach: "/coach/dashboard",
  student: "/student/dashboard",
};

function roleAllowedForPath(role: string, pathname: string) {
  if (role === "admin") return true; // admin her yere erişebilir
  if (role === "coach") return pathname.startsWith("/coach");
  if (role === "student") return pathname.startsWith("/student");
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user) {
    if (isPublic) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Kullanıcı giriş yapmış: rolünü çek ve doğru alana yönlendir.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "student";

  if (isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/student/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/login";
    return NextResponse.redirect(url);
  }

  if (!roleAllowedForPath(role, pathname) && !pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
