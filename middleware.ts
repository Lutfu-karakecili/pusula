import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  coach: "/coach/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
};

function isPathPublic(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/paketler" ||
    pathname === "/sss" ||
    pathname === "/mesafeli-satis-sozlesmesi" ||
    pathname === "/gizlilik-sozlesmesi" ||
    pathname === "/odeme-teslimat" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/ucretsiz-gorusme" ||
    pathname === "/koc-basvurusu"
  );
}

function roleAllowedForPath(role: string, pathname: string) {
  if (role === "admin") return true;
  if (role === "coach") return pathname.startsWith("/coach");
  if (role === "student") return pathname.startsWith("/student");
  if (role === "parent") return pathname.startsWith("/parent");
  return false;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const c of from.cookies.getAll()) {
    to.cookies.set(c.name, c.value, c);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    if (isPathPublic(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    copyCookies(supabaseResponse, res);
    return res;
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
    const res = NextResponse.redirect(url);
    copyCookies(supabaseResponse, res);
    return res;
  }

  if (pathname.startsWith("/dashboard") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/login";
    const res = NextResponse.redirect(url);
    copyCookies(supabaseResponse, res);
    return res;
  }

  if (!roleAllowedForPath(role, pathname) && !pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/login";
    const res = NextResponse.redirect(url);
    copyCookies(supabaseResponse, res);
    return res;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
