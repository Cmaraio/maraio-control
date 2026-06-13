import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const APP_CONFIG = {
  client_id: '8285062642673402',
  client_secret: process.env.ML_CLIENT_SECRET || 'yCGyzMllnF1LSJTSn7756I3qRL1Rx3F8',
  redirect_uri: process.env.ML_REDIRECT_URI || 'https://maraio.com.ar/callback',
  api_base: 'https://api.mercadolibre.com'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code, account } = req.query;
  if (!code || !account) return res.status(400).json({ error: 'Missing code or account' });

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: APP_CONFIG.client_id,
    client_secret: APP_CONFIG.client_secret,
    code,
    redirect_uri: APP_CONFIG.redirect_uri
  });

  try {
    const mlRes = await fetch(`${APP_CONFIG.api_base}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: params.toString()
    });
    const data = await mlRes.json();
    if (!mlRes.ok) return res.status(mlRes.status).json({ error: data });

    // Save tokens to Supabase
    await supabase.from('tokens').upsert({
      account,
      user_id: data.user_id,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      has_token: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'account' });

    return res.json({ success: true, user_id: data.user_id, account });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
