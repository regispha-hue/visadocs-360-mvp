import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(getRateLimitKey(request, "ai-chat"), 20, 10 * 60 * 1000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

    const { message } = await request.json();
    const apiKey = process.env.GOOGLE_API_KEY || "";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta";

    return NextResponse.json({ resposta: text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
