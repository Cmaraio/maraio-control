import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — load saved ads data
  if (req.method === 'GET') {
    const { account } = req.query;
    if (!account) return res.status(400).json({ error: 'Missing account' });
    const { data, error } = await supabase
      .from('ads_data')
      .select('data')
      .eq('account', account)
      .single();
    if (error || !data) return res.json({ ads: [] });
    return res.json({ ads: data.data || [] });
  }

  // POST — save ads data
  if (req.method === 'POST') {
    const { account, ads } = req.body;
    if (!account) return res.status(400).json({ error: 'Missing account' });
    const { error } = await supabase.from('ads_data').upsert({
      id: account,
      account,
      data: ads,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
