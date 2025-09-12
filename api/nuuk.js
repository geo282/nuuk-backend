// api/nuuk.js
export const config = { runtime: "edge" }; // Vercel Edge Runtime

// ⛔ Mets EXACTEMENT l'URL Netlify (sans slash final)
const ALLOWED_ORIGIN = "https://nuukiibot.netlify.app";

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};
const JSONH = { "Content-Type": "application/json" };

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, msg: "✅ Backend NUUK (Groq) opérationnel. Utilise POST pour poser une question." }),
      { status: 200, headers: CORS }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Méthode non autorisée (POST attendu)" }),
      { status: 405, headers: JSONH }
    );
  }

  try {
    const { question = "", filters = {}, history = [] } = await req.json();

    const system = `Tu es Nüuki, assistant technique NUUK.
- Étanchéité air/eau, membranes, menuiseries, toitures, DTU.
- Donne 4–6 points concrets : produits NUUK + étapes de mise en œuvre + points singuliers.
- Cite les références NUUK si pertinent (COCON SD20/SD90, COCON SD-ADAPT NT, BARDANE DF25, ARCUS FA1000...).`;

    const userCtx = `Contexte:
- Chantier: ${filters?.chantier || "non précisé"}
- Étanchéité: ${filters?.etancheite || "non précisé"}
- Bâtiment: ${filters?.batiment || "non précisé"}
- Dernière question: ${history?.at?.(-1)?.user || "—"}

Question: ${question}`;

    const messages = [
      { role: "system", content: system },
      ...(Array.isArray(history) ? history.map(m => ({ role: m.role || "user", content: m.content || "" })) : []),
      { role: "user", content: userCtx },
    ];

    // 🚀 Appel Groq (compat OpenAI)
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        temperature: 0.2,
        messages,
      }),
    });

    if (!r.ok) {
      const errTxt = await r.text().catch(() => "");
      return new Response(JSON.stringify({ ok: false, error: errTxt || `Groq HTTP ${r.status}` }), { status: 500, headers: JSONH });
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() || "Réponse vide.";
    return new Response(JSON.stringify({ ok: true, answer }), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Server error" }), { status: 500, headers: JSONH });
  }
}
