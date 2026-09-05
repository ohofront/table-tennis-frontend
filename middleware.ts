import { NextResponse, type NextRequest } from "next/server";
// Presence is only a navigation guard, never proof of role. AuthGuard restores
// the session with the backend; the backend must authorize every mutation.
export function middleware(request: NextRequest) {
  const cookieName = process.env.AUTH_REFRESH_COOKIE_NAME || "refreshToken";
  if (!request.cookies.has(cookieName)) {
    const url = new URL("/login", request.url);
    url.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export const config = {
  matcher: [
    "/matches/new",
    "/matches/:matchId/sets",
    "/players/new",
    "/players/:userId/edit",
    "/notices/new",
    "/notices/:id/edit",
    "/boards/new",
    "/boards/:id/edit",
    "/mypage",
    "/tournaments/new",
    "/tournaments/:year/:id/edit",
  ],
};
