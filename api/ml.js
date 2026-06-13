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

async function getToken(account) {
  const { data } = await supabase.from('tokens').select('*').eq('account', account).single();
  return data;
}

async function refreshToken(account, refreshTk) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: APP_CONFIG.client_id,
    client_secret: APP_CONFIG.client_secret,
    refresh_token: refreshTk
  });
  const mlRes = await fetch(`${APP_CONFIG.api_base}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!mlRes.ok) return null;
  const data = await mlRes.json();
  await supabase.from('tokens').upsert({
    account,
    user_id: data.user_id,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    has_token: true,
    updated_at: new Date().toISOString()
  }, { onConflict: 'account' });
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { account, endpoint } = req.query;
  if (!account || !endpoint) return res.status(400).json({ error: 'Missing params' });

  const tokenData = await getToken(account);
  if (!tokenData?.access_token) return res.status(401).json({ error: 'Not authenticated' });

  let accessToken = tokenData.access_token;

  const doRequest = async (token) => {
    return await fetch(`${APP_CONFIG.api_base}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
  };

  try {
    let mlRes = await doRequest(accessToken);
    if (mlRes.status === 401 && tokenData.refresh_token) {
      const newToken = await refreshToken(account, tokenData.refresh_token);
      if (newToken) mlRes = await doRequest(newToken);
    }
    const data = await mlRes.json();
    return res.status(mlRes.ok ? 200 : mlRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
