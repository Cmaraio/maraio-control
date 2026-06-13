import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('account, user_id, has_token')
      .in('account', ['maraio', 'maraio2']);

    const status = { maraio: { connected: false, user_id: null }, maraio2: { connected: false, user_id: null } };
    if (data) {
      data.forEach(row => {
        status[row.account] = { connected: row.has_token, user_id: row.user_id };
      });
    }
    return res.json(status);
  } catch (e) {
    return res.json({ maraio: { connected: false }, maraio2: { connected: false } });
  }
}
