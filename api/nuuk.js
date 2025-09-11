export const config = { runtime: "edge" }; // Vercel Edge Runtime

const JSONH = { "content-type": "application/json" };

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: JSONH });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok:false, error:"Méthode non autorisée (POST attendu)" }), { status: 405, headers: JSONH });
  }

  try {
    const { question, filters, history } = await req.json();

    const system = `Tu es Nüuki, assistant technique NUUK.
- Étanchéité air/eau, membranes, menuiseries, toitures, DTU.
- Réponds en 4–6 points concrets : produits NUUK, étapes de mise en œuvre, points singuliers, rappel DTU si utile.`;

    const user = `Question: ${question}
Contexte: ${JSON.stringify({ filters: filters || {}, lastUser: history?.at?.(-1)?.user || "" })}`;

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ ok:false, error:txt }), { status: 500, headers: JSONH });
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() || "Réponse vide.";
    return new Response(JSON.stringify({ ok:true, answer }), { status: 200, headers: JSONH });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || "Server error" }), { status: 500, headers: JSONH });
  }
}
