# Samsar IA — Déploiement

## Environnements

| Environnement | Usage | Base de données | DEMO_MODE |
|---------------|-------|-----------------|-----------|
| Local | Développement | In-memory ou Docker PG | `true` |
| Preview | PR Vercel | Supabase branch / démo | `true` |
| Production | Utilisateurs | Supabase PostgreSQL | `false` |

## Prérequis

- Node.js 20+
- pnpm 9+
- Compte Vercel (hébergement)
- Compte Supabase (PostgreSQL managé) — optionnel pour dev local
- Docker + Docker Compose — pour PostgreSQL local

## Développement local

### Option A — Mode démo (sans base de données)

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Ouvrir http://localhost:3000 → redirection `/fr/`.

### Option B — Avec PostgreSQL local

```bash
# 1. Démarrer PostgreSQL + PostGIS
docker compose up -d

# 2. Variables d'environnement
cp .env.example .env.local
# DATABASE_URL=postgresql://samsar:samsar_dev@localhost:5432/samsar

# 3. Appliquer le schéma
pnpm db:push

# 4. Peupler les données démo
pnpm db:seed

# 5. Lancer l'app
pnpm dev
```

## Docker Compose

Fichier : `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: samsar
      POSTGRES_PASSWORD: samsar_dev
      POSTGRES_DB: samsar
```

Commandes utiles :

```bash
docker compose up -d          # Démarrer
docker compose down           # Arrêter
docker compose down -v        # Supprimer volumes (reset DB)
docker compose logs postgres  # Logs
```

## Migrations Drizzle

| Commande | Usage |
|----------|-------|
| `pnpm db:generate` | Génère migration depuis `schema.ts` |
| `pnpm db:migrate` | Applique migrations en attente |
| `pnpm db:push` | Push direct schéma (dev rapide) |
| `pnpm db:seed` | Insère données démo |

Schéma source : `src/lib/db/schema.ts`  
Output migrations : `supabase/migrations/`

## Déploiement Vercel

### 1. Connecter le repository

```bash
# Via CLI
npm i -g vercel
vercel link
vercel env pull .env.local
```

Ou via dashboard Vercel → Import Git Repository.

### 2. Variables d'environnement (Production)

| Variable | Requis | Exemple |
|----------|--------|---------|
| `NEXT_PUBLIC_APP_URL` | ✓ | `https://samsar.ma` |
| `DATABASE_URL` | ✓ | `postgresql://...@db.supabase.co:5432/postgres` |
| `AUTH_SECRET` | ✓ | `<random-32+>` |
| `DEMO_MODE` | ✓ | `false` |
| `NODE_ENV` | auto | `production` |
| `OPENAI_API_KEY` | — | sk-... |
| `AI_PROVIDER` | — | `mock` ou `openai` |
| `NEXT_PUBLIC_MAP_STYLE` | — | URL tuiles prod |

### 3. Build settings

```
Framework Preset: Next.js
Build Command: pnpm build
Install Command: pnpm install
Output Directory: .next (default)
Node.js Version: 20.x
```

### 4. Déployer

```bash
vercel --prod
```

Ou push sur branche `main` si CI/CD activé.

## Supabase

### Création projet

1. [supabase.com](https://supabase.com) → New Project
2. Région : `eu-west-1` (proximité Maroc/UE)
3. Copier `DATABASE_URL` (connection pooling recommandé pour serverless)

### Extensions

Exécuter dans SQL Editor :

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

Ou appliquer `supabase/migrations/0000_init.sql`.

### Connection pooling

Pour Vercel serverless, utiliser le pooler Supabase :

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### Migration schéma

```bash
DATABASE_URL="postgresql://..." pnpm db:push
DATABASE_URL="postgresql://..." pnpm db:seed
```

### Variables Supabase (Phase 2 Auth)

```
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-only
```

## Pipeline CI recommandé

```yaml
# .github/workflows/ci.yml (exemple)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

## Scripts package.json

| Script | Description |
|--------|-------------|
| `pnpm dev` | Serveur dev port 3000 |
| `pnpm build` | Build production |
| `pnpm start` | Serveur production local |
| `pnpm test` | Vitest |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |

## Vérifications post-déploiement

```bash
# Health checks
curl -I https://samsar.ma/fr
curl https://samsar.ma/sitemap.xml
curl https://samsar.ma/robots.txt

# DB connectivity (depuis machine autorisée)
DATABASE_URL="..." pnpm db:seed
```

## Rollback

- Vercel : redeploy deployment précédent via dashboard
- DB : restaurer backup Supabase (Point-in-Time Recovery)
- Migrations : reverser manuellement ou restaurer snapshot

## Monitoring (Phase 2)

- Vercel Analytics / Speed Insights
- Supabase Dashboard (queries, connexions)
- Sentry pour erreurs runtime
- Uptime monitoring (Better Stack, Pingdom)

## Références

- Architecture : [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Sécurité : [`SECURITY.md`](./SECURITY.md)
- Setup complet : [`README.md`](../README.md)
