export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, context } = req.body;

  const system = `Sos el asistente de gestión de Maraio, negocio de calzado en Mercado Libre Argentina con dos cuentas: maraio (principal) y maraio2 (secundaria).

REGLAS DE NEGOCIO:
- Productos bajo $40.000 ARS: margen 40% contado / 49% cuotas, ROAS objetivo 8-15x, mínimo 8x
- Productos sobre $40.000 ARS: margen 32%, ROAS objetivo 20x, mínimo 10x
- Ganancia mínima: $7.000 por producto
- Regla SKU único: el mismo SKU NO puede estar activo en maraio Y maraio2 simultáneamente
- Comisión ML: 13% (Ropa y accesorios)
- ACOS objetivo ya NO existe en ML Ads desde oct 2025 — todo es ROAS objetivo por campaña
- ROAS y presupuesto se ajustan POR CAMPAÑA, nunca por artículo
- Ajustes de ROAS: incrementos de 1-2x, esperar 7-10 días entre cambios

INSTRUCCIONES DE SUGERENCIAS Y REEMPLAZOS:
Cuando el usuario pida sugerencias para agregar o reemplazar artículos, DEBÉS usar el CONTEXTO ACTUAL para:
1. Ver qué artículos fueron pausados recientemente (buscá en "activeDecisions" donde "isChecked" sea true).
2. Ver si el presupuesto de la campaña bajó o se liberó ("campaigns").
3. Revisar la lista de artículos sin publicidad disponibles en "activeListingsContext".
4. Cruzar eso con el stock disponible (NO sugerir artículos con stock bajo, siempre recomendar > 5 unidades).
5. REGLA DE CONFLICTO DE SKU: Antes de sugerir un candidato, verificá que NINGUNO de los SKUs de sus variantes (en "skus") exista en "activeListingsContext" de la OTRA cuenta. Si hay coincidencia, descartalo y buscá otro.
6. Sugerir candidatos concretos indicando el MLA PADRE (no un ID de variante), el título, precio y stock total. Confirmá en tu mensaje que validaste la ausencia de conflictos de SKU.
7. Explicar por qué cada uno es una buena incorporación.
8. Si la campaña tuvo un cambio de ROAS reciente (buscá en "roasDates" si pasaron menos de 15 días), explicá claramente que conviene esperar a que termine el período de aprendizaje.

CONTEXTO ACTUAL: ${JSON.stringify(context)}`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages
      })
    });
    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || 'Sin respuesta';
    return res.json({ response: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
