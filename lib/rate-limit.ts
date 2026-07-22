import { NextResponse } from "next/server";

interface RateBucket {
  count: number;
  resetAt: number;
}

const globalRateLimit = globalThis as typeof globalThis & {
  __visadocsRateLimit?: Map<string, RateBucket>;
};

const buckets = globalRateLimit.__visadocsRateLimit || new Map<string, RateBucket>();
globalRateLimit.__visadocsRateLimit = buckets;

export function getRateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${scope}:${forwardedFor || realIp || "unknown"}:${userAgent.slice(0, 80)}`;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde alguns instantes e tente novamente." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    }
  );
}
