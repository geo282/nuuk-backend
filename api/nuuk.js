// /api/nuuk.js
export const config = { runtime: "edge" }; // Vercel Edge Runtime

// ✅ Mets ici ton domaine Netlify exact (sans slash final)
const ALLOW_ORIGIN = "https://nuukii2-0.netlify.app";

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export default async function handler(req) {
  // Pré-vol CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // GET de test depuis le navigateur
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, msg: "✅ Backend NUUK opérationnel. Utilise POST pour poser une question." }),
      { status: 200, headers: CORS }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Méthode non autorisée (POST attendu)" }),
      { status: 405, headers: CORS }
    );
  }

  try {
    const { question = "", history = [] } = await req.json();

    const system = `Tu es Nüuki, assistant technique NUUK.
- Domaines: étanchéité air/eau, membranes, menuiseries, toitures, DTU.
- Réponds en 4–6 points clairs.
- Propose des produits NUUK adaptés + étapes clés de mise en œuvre + points singuliers.`;

    const user = `Question: ${question}
Historique: ${JSON.stringify(history).slice(0, 800)}`;

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // défini dans Vercel
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return new Response(JSON.stringify({ ok: false, error: errTxt }), { status: 500, headers: CORS });
    }

    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "Réponse vide.";
    return new Response(JSON.stringify({ ok: true, answer }), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: CORS });
  }
}
