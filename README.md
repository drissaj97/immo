# Samsar IA

**Plateforme immobilière intelligente au Maroc** — marketplace premium, simulateur d'investissement et assistant conversationnel pour acheteurs, investisseurs et professionnels.

> *Rechercher, comprendre et sécuriser votre décision immobilière.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)

---

## Description produit

Samsar IA est une marketplace immobilière multi-acteurs orientée **premium** et **data-driven** :

- **Recherche avancée** : filtres classiques + assistant IA en langage naturel
- **Investissement** : simulateur de rentabilité (rendement brut/net, cash-flow, scénarios)
- **Comparaison** : jusqu'à 3 biens côte à côte
- **Publication professionnelle** : agents et agences soumettent des annonces modérées
- **Conformité** : provenance explicite des données, mode démo clairement identifié
- **Multilingue** : FR, EN, AR (RTL) · devises MAD, EUR, USD

Documentation complète : [`docs/`](./docs/)

| Document | Contenu |
|----------|---------|
| [PRODUCT_REQUIREMENTS.md](./docs/PRODUCT_REQUIREMENTS.md) | PRD, périmètre MVP |
| [USER_PERSONAS.md](./docs/USER_PERSONAS.md) | 8 personas |
| [USER_FLOWS.md](./docs/USER_FLOWS.md) | Parcours clés |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Stack et modules |
| [DATABASE_MODEL.md](./docs/DATABASE_MODEL.md) | Schéma ER |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel, Supabase, Docker |

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Route Handlers Next.js, Server Components |
| Base de données | PostgreSQL 16 + PostGIS (Drizzle ORM) |
| Auth | JWT local (MVP) → Supabase Auth (Phase 2) |
| Cartes | MapLibre GL |
| Tests | Vitest |
| Hébergement | Vercel + Supabase |

---

## Prérequis

- **Node.js** 20 ou supérieur
- **pnpm** 9+ (gestionnaire de paquets recommandé)
- **Docker** + **Docker Compose** (optionnel, pour PostgreSQL local)
- **Git**

---

## Installation

```bash
# Cloner le repository
git clone https://github.com/samsar-ia/samsar-ia.git
cd samsar-ia

# Installer les dépendances
pnpm install
```

---

## Variables d'environnement

Copier le fichier exemple et adapter :

```bash
cp .env.example .env.local
```

| Variable | Requis | Description | Défaut |
|----------|--------|-------------|--------|
| `NEXT_PUBLIC_APP_URL` | ✓ | URL publique de l'app | `http://localhost:3000` |
| `NODE_ENV` | — | Environnement | `development` |
| `DATABASE_URL` | — | PostgreSQL (optionnel en démo) | — |
| `AUTH_SECRET` | prod | Secret JWT (≥ 32 caractères) | dev fallback |
| `DEMO_MODE` | — | Affiche bannière démo | `true` |
| `AI_PROVIDER` | — | `mock` ou `openai` | `mock` |
| `OPENAI_API_KEY` | — | Clé OpenAI (optionnelle) | — |
| `NEXT_PUBLIC_MAP_STYLE` | — | URL style MapLibre | demo tiles |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Supabase (Phase 2) | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Clé anon Supabase | — |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Service role (server-only) | — |

---

## Base de données

### Option A — Mode démo (sans PostgreSQL)

Aucune configuration requise. L'application utilise les données in-memory de `src/lib/data/demo-data.ts`.

```bash
pnpm dev
```

### Option B — PostgreSQL local (Docker)

```bash
# Démarrer PostgreSQL + PostGIS
docker compose up -d

# Vérifier que le conteneur est healthy
docker compose ps
```

Configurer dans `.env.local` :

```
DATABASE_URL=postgresql://samsar:samsar_dev@localhost:5432/samsar_ia
```

### Migrations

```bash
# Appliquer le schéma Drizzle (développement rapide)
pnpm db:push

# Ou générer + migrer (production)
pnpm db:generate
pnpm db:migrate
```

Schéma source : `src/lib/db/schema.ts`  
Migrations SQL : `supabase/migrations/`

### Seed (données démo)

```bash
pnpm db:seed
```

Insère locations, listings et taux de change depuis `demo-data.ts`.  
Sans `DATABASE_URL`, le seed s'arrête proprement (mode in-memory actif).

---

## Développement

```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) — redirection automatique vers `/fr/`.

### Comptes démo

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@samsar-ia.demo` | `Admin123!` | Administrateur |
| `agent@samsar-ia.demo` | `Agent123!` | Agent immobilier |
| `acheteur@samsar-ia.demo` | `Acheteur123!` | Acheteur |

### Pages principales

| Route | Description |
|-------|-------------|
| `/fr/` | Accueil |
| `/fr/biens` | Catalogue |
| `/fr/samsar-ia` | Recherche IA |
| `/fr/simulateur-rentabilite` | Simulateur investissement |
| `/fr/comparer` | Comparateur |
| `/fr/admin` | Modération (admin) |
| `/fr/dashboard` | Espace connecté |

---

## Tests

```bash
# Exécuter tous les tests
pnpm test

# Mode watch
pnpm test:watch

# Vérification TypeScript
pnpm typecheck

# Lint
pnpm lint
```

Tests couvrant : calculs investissement, parseur recherche NL, conversion devises.

---

## Build

```bash
# Build production
pnpm build

# Démarrer le serveur production localement
pnpm start
```

---

## Déploiement

### Vercel (recommandé)

1. Connecter le repository GitHub à [Vercel](https://vercel.com)
2. Configurer les variables d'environnement (voir [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md))
3. Build command : `pnpm build`
4. Déployer : `vercel --prod`

Variables production minimales :
```
NEXT_PUBLIC_APP_URL=https://votre-domaine.ma
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
AUTH_SECRET=<secret-aléatoire-32-chars-minimum>
DEMO_MODE=false
```

### Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (région EU recommandée)
2. Activer extensions `pgcrypto` et `postgis`
3. Copier `DATABASE_URL` (pooler pour serverless)
4. Exécuter `pnpm db:push && pnpm db:seed`

Guide complet : [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

### Docker Compose (dev local uniquement)

```bash
docker compose up -d      # Démarrer PostgreSQL
docker compose down       # Arrêter
docker compose down -v    # Reset complet (supprime les données)
```

---

## Structure du projet

```
├── src/
│   ├── app/[locale]/       # Pages et API routes
│   ├── components/         # Composants UI
│   ├── lib/                # Auth, DB, i18n, SEO, demo-data
│   ├── modules/            # Logique métier (investment, search)
│   └── server/repositories/# Accès données
├── docs/                   # Documentation produit & technique
├── scripts/seed.ts         # Seed PostgreSQL
├── supabase/migrations/    # Migrations SQL
├── tests/                  # Tests Vitest
├── docker-compose.yml      # PostgreSQL local
└── drizzle.config.ts       # Config Drizzle ORM
```

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build production |
| `pnpm start` | Serveur production |
| `pnpm test` | Tests Vitest |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Générer migration Drizzle |
| `pnpm db:migrate` | Appliquer migrations |
| `pnpm db:push` | Push schéma (dev) |
| `pnpm db:seed` | Peupler données démo |

---

## Licence

Projet privé — tous droits réservés © Samsar IA 2026.

---

## Changelog

Voir [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — version actuelle : **v0.1.0** (MVP initial).
