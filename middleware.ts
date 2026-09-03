import { NextResponse, type NextRequest } from "next/server";

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function getSessionUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = new URL(supabaseUrl).host.split(".")[0];

  const cookieName = `sb-${projectRef}-auth-token`;
  const raw = request.cookies.get(cookieName)?.value;
  if (!raw) return null;

  let parsed: { access_token?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const accessToken = parsed?.access_token;
  if (!accessToken) return null;

  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;

  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) return null;

  const userId = payload.sub as string | undefined;
  if (!userId) return null;

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 0 },
    }
  );

  let role = "student";
  if (res.ok) {
    const rows = (await res.json()) as { role?: string }[];
    if (rows.length > 0 && rows[0].role) {
      role = rows[0].role;
    }
  }

  return { userId, role };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  if (isPathPublic(pathname)) return response;

  const session = await getSessionUser(request);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { role } = session;

  if (pathname === "/") {
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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
