# Maraio Control

## Setup en Vercel

### Variables de entorno necesarias en Vercel:
- `SUPABASE_URL` — URL de tu proyecto Supabase
- `SUPABASE_ANON_KEY` — Anon key de Supabase  
- `ANTHROPIC_API_KEY` — API key de Anthropic
- `ML_CLIENT_SECRET` — yCGyzMllnF1LSJTSn7756I3qRL1Rx3F8
- `ML_REDIRECT_URI` — https://maraio.com.ar/callback

### Tabla en Supabase:
```sql
CREATE TABLE tokens (
  account TEXT PRIMARY KEY,
  user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  has_token BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Update

## Update2
