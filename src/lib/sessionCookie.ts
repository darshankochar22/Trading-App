import type { NextRequest } from "next/server";

function parseSameSite(raw: string | undefined): "lax" | "strict" | "none" {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "strict" || value === "none") return value;
  return "lax";
}

function shouldUseSecureCookie(request: NextRequest) {
  const forceInsecure = process.env.AUTH_INSECURE_COOKIE === "true";
  if (forceInsecure) return false;

  const forceSecure = process.env.AUTH_FORCE_SECURE_COOKIE === "true";
  if (forceSecure) return true;

  if (process.env.NODE_ENV !== "production") return false;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const isHttps = request.nextUrl.protocol === "https:" || forwardedProto === "https";
  return isHttps;
}

export function buildSessionCookieOptions(request: NextRequest, expires?: Date) {
  const sameSite = parseSameSite(process.env.AUTH_COOKIE_SAMESITE);
  return {
    httpOnly: true,
    sameSite,
    secure: shouldUseSecureCookie(request),
    path: "/",
    ...(process.env.AUTH_COOKIE_DOMAIN ? { domain: process.env.AUTH_COOKIE_DOMAIN } : {}),
    ...(expires ? { expires } : {}),
  };
}

