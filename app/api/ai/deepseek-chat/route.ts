import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
