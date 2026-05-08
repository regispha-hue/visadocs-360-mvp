/**
 * VISADOCS AI Client - Google Gemini (gratuito)
 * Único ponto de integração de IA do sistema
 */

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || "";

export async function chat(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: messages.map(m => ({ parts: [{ text: m.content }] })) }),
    }
  );
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function visadocsAssistant(message: string): Promise<string> {
  return chat([
    { role: "user", content: "Voce e o VISA Assistente da Visadocs 360. " + message }
  ]);
}
