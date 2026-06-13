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

  // GET — load checklist
  if (req.method === 'GET') {
    const { account } = req.query;
    if (!account) return res.status(400).json({ error: 'Missing account' });
    const { data, error } = await supabase
      .from('checklist_data')
      .select('id, checked')
      .eq('account', account);
    if (error || !data) return res.json({ checklist: {} });
    const checklist = {};
    data.forEach(row => { if (row.checked) checklist[row.id] = true; });
    return res.json({ checklist });
  }

  // POST — save checklist item
  if (req.method === 'POST') {
    const { account, id, checked } = req.body;
    if (!account || !id) return res.status(400).json({ error: 'Missing params' });
    if (checked) {
      await supabase.from('checklist_data').upsert({
        id: `${account}_${id}`,
        account,
        checked: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } else {
      await supabase.from('checklist_data').delete()
        .eq('id', `${account}_${id}`);
    }
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
