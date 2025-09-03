export const config = { runtime: "edge" }; // Vercel Edge Runtime

const ALLOW_ORIGIN = "*"; // en prod: remplace par "https://TON-SITE.netlify.app"
const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
    const { question, filters, history } = await req.json();
    const sys = `Tu es Nüuki, assistant technique NUUK.
- Étanchéité air/eau, membranes, menuiseries, toitures, DTU.
- Donne 4–6 points concrets (produits NUUK + étapes + points singuliers).`;

    const ctx = `
Contexte:
- Chantier: ${filters?.chantier || "non précisé"}
- Étanchéité: ${filters?.etancheite || "non précisé"}
- Bâtiment: ${filters?.batiment || "non précisé"}
Dernière question: ${history?.at?.(-1)?.user || ""}

Question: ${question}
Consignes:
- Propose une solution NUUK adaptée.
- Liste les étapes clés de mise en œuvre.
- Mentionne les points singuliers.
- Rappelle brièvement la logique DTU si pertinent.`;

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: ctx }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const err = await r.text();
      return new Response(JSON.stringify({ ok:false, error: err }), { status: 500, headers: { ...CORS, "content-type":"application/json" } });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "Réponse vide.";
    return new Response(JSON.stringify({ ok:true, answer: text }), { headers: { ...CORS, "content-type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || "Server error" }), { status: 500, headers: { ...CORS, "content-type":"application/json" } });
  }
}
