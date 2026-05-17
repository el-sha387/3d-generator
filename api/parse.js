/**
 * Vercel Serverless Function: POST /api/parse
 * Parst Freitext-Beschreibungen in Formparameter via Claude Haiku.
 * API-Key wird als Umgebungsvariable ANTHROPIC_API_KEY gesetzt (nie im Client).
 */

const SYSTEM_PROMPT = `Du bist ein 3D-Druck-Assistent. Analysiere Teilebeschreibungen und extrahiere Geometrieparameter.

Antworte IMMER ausschließlich mit gültigem JSON. Kein Markdown, keine Codeblöcke.

Verfügbare Formtypen und Parameter:
- box:              {"width":mm, "height":mm, "depth":mm}
- cylinder:         {"diameter":mm, "height":mm}
- hollow_cylinder:  {"outer_diameter":mm, "inner_diameter":mm, "height":mm}
- sphere:           {"diameter":mm}
- kegel:            {"diameter_bottom":mm, "diameter_top":mm, "height":mm}
- rohr:             {"outer_diameter":mm, "inner_diameter":mm, "height":mm}
- abdeckkappe:      {"outer_diameter":mm, "wall_thickness":mm, "lip_height":mm, "top_thickness":mm}
- flansch:          {"flange_diameter":mm, "pipe_diameter":mm, "wall_thickness":mm, "flange_thickness":mm, "pipe_height":mm}
- sechskant:        {"width_across_flats":mm, "height":mm}
- sechskant_mutter: {"width_across_flats":mm, "thread_diameter":mm, "height":mm}
- steckleiste:      {"total_length":mm, "width":mm, "thickness":mm, "clearance":mm}

Wenn alle Parameter vorhanden:
{"type":"shape","kind":"<formtyp>","params":{...},"summary":"kurze deutsche Beschreibung"}

Wenn Parameter fehlen:
{"type":"question","question":"konkrete kurze Rückfrage auf Deutsch"}

Regeln: cm→mm (×10). "Stärke"/"Dicke" = height. "Distanzscheibe"/"Hülse" = hollow_cylinder. "Deckel" = abdeckkappe. Nur JSON.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht konfiguriert in Vercel' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
