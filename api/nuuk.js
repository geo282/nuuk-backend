// api/nuuk.js
export const config = { runtime: "edge" }; // Vercel Edge

// ✅ Mets exactement ton URL Netlify ici
const ORIGINE_AUTORISEE = "https://nuukiibot.netlify.app";

const CORS = {
  "Access-Control-Allow-Origin": ORIGINE_AUTORISEE,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export default async function handler(req) {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // GET = ping
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, msg: "✅ Backend NUUK opérationnel (CORS OK)" }),
      { status: 200, headers: CORS }
    );
  }

  // POST attendu
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Méthode non autorisée (POST attendu)" }),
      { status: 405, headers: CORS }
    );
  }

  try {
    const { question = "" } = await req.json();

    const payload = {
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: "Tu es Nüüki, assistant technique NUUK." },
        { role: "user", content: question },
      ],
    };

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(
        JSON.stringify({ ok: false, error: `Appel Groq échoué: ${txt}` }),
        { status: 500, headers: CORS }
      );
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content || "Réponse vide";

    return new Response(JSON.stringify({ ok: true, answer }), {
      status: 200,
      headers: CORS,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 500, headers: CORS }
    );
  }
}
