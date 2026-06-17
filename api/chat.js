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
Cuando el usuario pida sugerencias para agregar o reemplazar artículos en Product Ads, DEBÉS usar el CONTEXTO ACTUAL para:
1. Revisar la lista consolidada de publicaciones en "consolidatedListings".
2. Buscar candidatos que NO tengan publicidad activa ("hasAds": false) y tengan stock mayor a 5 ("stock").
3. Evaluar el candidato basándote en su "sales" (ventas), su "visits" y el margen/ROAS objetivo que corresponde por su "price".
4. REGLA DE CONFLICTO DE SKU: Antes de sugerir un candidato, verificá que NINGUNO de sus SKUs (en "skus") se encuentre activo en los ads de la OTRA cuenta.
5. Sugerir candidatos concretos indicando siempre el MLA PADRE ("mlaParent"), título, precio, ventas y stock. Explicá tu razonamiento (ej: "tiene X ventas, no está en ads, su precio requiere ROAS objetivo Yx").
6. Cuando el usuario confirme que quiere agregar uno o más candidatos (ej. "dale, agregá", "sumalos"), confirmá en tu respuesta mencionando claramente los códigos MLA PADRE (ej: "Agregando MLA123456789..."). La interfaz detectará los MLAs y ejecutará la inserción con la misma validación de la FASE 1.
7. Confirmá SIEMPRE en tu mensaje que validaste la ausencia de conflictos de SKU y que estás recomendando la publicación principal (padre), no una variante suelta.

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
