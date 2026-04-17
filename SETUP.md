# Nails Finance — Guia de Setup

## 1. Supabase (Base de dados)

1. Vai a [supabase.com](https://supabase.com) e cria uma conta gratuita
2. Cria um novo projeto (escolhe região Europe West)
3. Vai a **SQL Editor** e cola o conteúdo de `supabase/schema.sql` — corre para criar as tabelas
4. Vai a **Project Settings → API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`
5. Vai a **Storage** → cria um bucket chamado `nails` (público)

## 2. Google Calendar API

1. Vai a [console.cloud.google.com](https://console.cloud.google.com)
2. Cria um novo projeto (ex: "Nails Finance")
3. Vai a **APIs & Services → Enable APIs** → activa **Google Calendar API**
4. Vai a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` (dev) e `https://TUA-APP.vercel.app/api/auth/google/callback` (produção)
5. Copia Client ID e Client Secret

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preenche o ficheiro `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_PASSWORD=escolhe-uma-password-segura
```

## 4. Correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 5. Deploy no Vercel (para usar no telemóvel)

```bash
npm install -g vercel
vercel
```

Ou liga o repositório GitHub ao Vercel e configura as variáveis de ambiente no painel.

Depois do deploy, atualiza:
- `NEXT_PUBLIC_APP_URL` com o URL do Vercel
- `GOOGLE_REDIRECT_URI` com `https://TUA-APP.vercel.app/api/auth/google/callback`
- Adiciona o mesmo redirect URI nas credenciais do Google Console

## 6. Primeiro uso

1. Abre a app e faz login com a password que definiste
2. Vai a **Serviços** e confirma que os preços estão corretos
3. Vai a **Calendário** e clica em "Ligar Google Calendar"
4. Autentica com a conta Google que tem o calendário
5. Clica em **Sincronizar** — a app importa automaticamente todos os eventos do mês

## Instalar como app no telemóvel (PWA)

**iPhone (Safari):**
1. Abre o link da app no Safari
2. Toca no ícone de partilha ↑
3. "Adicionar ao Ecrã de Início"

**Android (Chrome):**
1. Abre o link no Chrome
2. Toca nos 3 pontos → "Adicionar ao ecrã inicial"
