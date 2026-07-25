# Changelog

Toutes les modifications notables du projet DarBladi sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).  
Versionnement sémantique : [SemVer](https://semver.org/lang/fr/).

---

## [1.3.0] — 2026-07-25

### Agrégation multi-sources — « Toutes les annonces du Maroc »

**Plateforme d'agrégation conforme**
- Module `src/lib/aggregation/` — normalisation, déduplication, sync
- Sources : Holding IMMO, DarBladi, Avito*, Mubawab* (*partenariat requis)
- Page `/agregateur` — stats par source
- Filtre `?source=avito` sur `/biens`
- Badge source sur chaque annonce + lien original

**Activation Avito/Mubawab (sans scraping)**
- Flux partenaire JSON : `data/feeds/avito.json`, `mubawab.json`
- PropAPIS licencié : `PROPAPIS_API_KEY`
- URL flux : `AVITO_PARTNER_FEED_URL`, `MUBAWAB_PARTNER_FEED_URL`
- Cron `POST /api/v1/cron/aggregation`

**Documentation** : `docs/AGGREGATION.md`

---

## [1.2.0] — 2026-07-25

### Quota OpenAI + catalogue Holding IMMO

**Résolution quota OpenAI**
- Fallback automatique `ResilientLLMProvider` si `insufficient_quota`
- Endpoint `GET /api/v1/ai/health` — diagnostic quota/billing
- Variable `AI_FALLBACK_ON_QUOTA=true` (défaut)
- Script `pnpm exec tsx scripts/test-openai.ts`

**Catalogue réel Holding IMMO (50 annonces)**
- Import first-party depuis sitemap + JSON-LD Schema.org
- Script `pnpm import:holding` → `src/lib/data/holding-listings.ts`
- Catalogue unifié via `getCatalogListings()` (~68 annonces publiées)
- `isDemo: false`, photos réelles, références HI###, source tracée

---

## [1.1.0] — 2026-07-25

### Phase 9 — Release

**OpenAI production**
- `AI_PROVIDER=openai` active LLM + embeddings (1536D)
- Script `pnpm db:seed-embeddings` pour pgvector

**Stripe Subscriptions**
- Mode `STRIPE_SUBSCRIPTION_MODE=true` pour Checkout récurrent
- Billing Portal `/api/billing/portal`
- Webhooks `invoice.paid`, `customer.subscription.updated`

**Mobile auth + favoris**
- API `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- API `GET/POST /api/v1/favorites` (Bearer JWT)
- App Expo : login, favoris, déconnexion

**Push notifications**
- Provider mock + Expo Push API
- Cron alertes envoie email + push
- `POST /api/v1/push/register`

**Release prep**
- `mobile/eas.json` pour builds App Store / Play Store
- 57 tests passent

---

## [1.0.0] — 2026-07-25

### Phase 8 — Mobile & scale

**Stripe Checkout production**
- Client REST Stripe (`createCheckoutSession`, vérification webhook HMAC)
- Redirection Checkout depuis `/api/billing/subscribe` et `SubscribeButton`
- Webhook `checkout.session.completed` → activation abonnement

**OpenAI embeddings + pgvector**
- Provider `mock` (64D) et `openai` (text-embedding-3-small, 1536D)
- Repository pgvector avec fallback in-memory
- Variable `EMBEDDING_PROVIDER=openai`

**Expansion géographique 20+**
- +8 villes : Nador, Safi, Mohammedia, Settat, Beni Mellal, Khouribga, Laâyoune, Dakhla
- 23 quartiers, 22 villes, 18 annonces publiées

**Facturation MRR**
- Cron `POST /api/v1/cron/billing` — renouvellements automatiques mock/Stripe

**App mobile Expo**
- `mobile/` — liste biens + détail via API partenaires v1
- 50 tests passent

---

## [0.9.0] — 2026-07-25

### Phase 7 — Production & croissance

**Stripe & webhooks**
- Endpoint `POST /api/v1/webhooks/stripe` (signature stub, events checkout/payment_intent)

**Upload média**
- `StorageProvider` mock + Supabase Storage
- API `POST /api/upload/media` + upload photo sur création annonce

**Embeddings & RAG hybride**
- Module embeddings 64D (mock pgvector)
- Index listings + quartiers, recherche sémantique
- Migration SQL `002_pgvector_embeddings.sql`

**Expansion géographique**
- +5 villes : Essaouira, Tétouan, Meknès, Oujda, El Jadida
- +3 annonces publiées (15 total)

**Programme affiliation**
- Codes parrainage (`?ref=CODE`), tracking visites
- Pages `/affiliation`, `/dashboard/affiliation`
- 40 tests passent

---

## [0.8.0] — 2026-07-25

### Phase 6 complétée — Paiements, abonnements, PWA offline

**Paiement en ligne (démo)**
- Module `PaymentProvider` (mock + stub Stripe)
- Acompte réservation sur fiches bien (5 % min 5 000 MAD)
- API `/api/payments/deposit`, page `/dashboard/reservations`

**Facturation agences**
- 4 plans tarifaires (`/tarifs`) : Gratuit, Investisseur, Pro, Enterprise
- API `/api/billing/subscribe`, dashboard `/dashboard/facturation`
- Schéma DB `payments`, `subscriptions`

**PWA offline**
- Service worker `/sw.js` avec cache pages FR
- Page `/offline`, enregistrement automatique
- 35 tests passent

---

## [0.7.0] — 2026-07-25

### Phase 6 — API partenaires, CNDP, PWA, emails

**API publique v1**
- Endpoints `/api/v1/listings`, `/api/v1/listings/[id]`, `/api/v1/market-metrics`, `/api/v1/health`
- Authentification par clé API + rate limiting (60 req/min)
- Documentation `/developpeurs`
- Clé démo : `darbladi-demo-partner-key`

**Conformité CNDP**
- Page `/conformite` (Loi 09-08)
- Cookie consent banner
- Export et suppression données `/dashboard/donnees`
- API `/api/account` (GET export, DELETE suppression)

**PWA & emails**
- Manifest PWA (`manifest.ts` + icônes)
- Provider email mock + stub Resend
- Notifications alertes recherche et leads
- Cron stub `/api/v1/cron/alerts`

**Expansion**
- Quartiers Agadir Founty, Fès Médina
- 29 tests passent

---

## [0.6.0] — 2026-07-25

### Phase 3.1 — RAG quartiers + début Phase 6

**RAG quartiers**
- Base connaissance 8 quartiers (`neighborhood-knowledge.ts`)
- Module RAG mock avec scoring keyword (`modules/ai/rag.ts`)
- Outil IA `getNeighborhoodContext` intégré à l'assistant
- Citations contexte quartier dans les réponses DarBladi
- Pages SEO `/villes/[ville]/[quartier]` enrichies
- 4 tests RAG

**Phase 6 (démarrage)**
- Dashboard analytics investisseur (`/dashboard/analytics`)
- Espace agence multi-agents (`/dashboard/agence`)
- Layout dashboard avec auth obligatoire
- Sitemap étendu (quartiers, professionnels, promoteurs)

---

## [0.5.0] — 2026-07-25

### Phase 5 — Marketplace multi-acteurs

- Pages `/professionnels`, `/promoteurs` avec fiches agences, agents et programmes neufs
- Dashboard CRM `/dashboard/leads` (statuts new → contacted → qualified → closed)
- Import CSV partenaires `/dashboard/import` + API `/api/import/listings`
- Alertes et recherches sauvegardées `/dashboard/alertes` + API `/api/saved-searches`
- Données démo : 3 agences, 2 promoteurs, 3 agents, 3 programmes neufs
- Navigation enrichie (Professionnels, Promoteurs)
- Formulaire contact → création lead

---

## [0.4.0] — 2026-07-25

### Phase 4 — Production data & auth

- Repository PostgreSQL pour listings avec fallback `DEMO_MODE` / mémoire
- Abstraction auth `AUTH_PROVIDER` (JWT + stub Supabase-ready)
- Favoris persistants API `/api/favorites` + page dashboard
- Simulations et rapports persistés en DB quand PostgreSQL configuré
- Schéma étendu : `organizations`, `leads`, `saved_searches`, `projects`, etc.
- Seed enrichi : users bcrypt, orgs, leads, `external_id` pour IDs démo
- Migration RLS `supabase/migrations/001_rls.sql`
- CI GitHub Actions (typecheck, lint, test, build)
- `.env.example` documenté

---

## [0.3.0] — 2026-07-25

### Rebranding DarBladi + Phase 3 — Intelligence artificielle

**Rebranding complet** : Samsar IA → **DarBladi** (marque, routes, cookies, emails démo, base PostgreSQL)

- Route assistant : `/darbladi` (redirect legacy `/samsar-ia`)
- Package npm : `darbladi`
- Comptes démo : `@darbladi.demo`

**Phase 3 — Assistant IA**

- Abstraction `LLMProvider` (Mock + OpenAI)
- Outils contrôlés : `searchListings`, `getListing`, `compareListings`, `calculateInvestment`, `getMarketMetrics`
- Service `runAssistant` avec citations (fact / calculation / estimate / hypothesis)
- API chat `/api/darbladi/chat` + rate limiting
- UI conversationnelle multi-tours (`DarBladiAssistant`)
- Fallback mock sans clé API ; activer OpenAI via `AI_PROVIDER=openai` + `OPENAI_API_KEY`
- 19 tests passent

---

## [0.2.0] — 2026-07-25

### Phase 2 — Investissement

- Score d'investissement transparent /100 avec 10 dimensions pondérées
- Historique de prix fictif sur les fiches biens (graphique + événements)
- Estimation par comparables de vente (`/estimation`)
- Rapport d'investissement imprimable/PDF (`/dashboard/rapports/[id]`)
- Comparateur enrichi avec scores et cash-flow
- Simulations sauvegardées (`/dashboard/simulations`) — auth requise
- Métriques sectorielles et comparables de démonstration
- Schéma DB : `listing_price_history`, `market_metrics`, `investment_scenarios`, `investment_reports`
- Tests : score, valuation, rapport


### 🎉 Release initiale MVP

Première version publique de démonstration de la plateforme immobilière intelligente DarBladi, ciblant le marché marocain.

### Ajouté

#### Parcours utilisateur
- Page d'accueil avec hero, recherche rapide et sélection de biens
- Catalogue `/acheter`, `/louer`, `/neuf` avec filtres avancés
- Fiches bien `/biens/[slug]` avec galerie, caractéristiques et carte
- Comparateur multi-biens (jusqu'à 3)
- Carte interactive MapLibre `/carte`
- Section investissement `/investir` et simulateur `/simulateur-rentabilite`
- Assistant DarBladi `/darbladi` (recherche en langage naturel)

#### Données
- 15+ annonces fictives couvrant Marrakech, Rabat, Casablanca, Salé, Tanger, Kénitra, Bouznika
- Référentiel 8 quartiers avec coordonnées GPS
- Taux de change indicatifs MAD/EUR/USD (Banque Al-Maghrib démo)
- Marquage `isDemo: true` sur toutes les entités

#### Authentification & rôles
- Connexion / inscription JWT (cookie HttpOnly)
- Comptes démo : admin, agent, acheteur
- Dashboard utilisateur et favoris
- Publication annonce par agents → modération admin

#### Administration
- Back-office `/admin` : validation et rejet d'annonces
- API `approve` / `reject` pour changement de statut

#### Internationalisation
- Support FR (défaut), EN, AR avec RTL
- Sélecteurs locale et devise (MAD, EUR, USD)
- Middleware redirection automatique vers locale

#### SEO
- SSR App Router avec `generateMetadata`
- Sitemap multilingue (`/sitemap.xml`)
- `robots.txt` (exclusion admin, api, auth)
- JSON-LD Schema.org `RealEstateListing`

#### Technique
- Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Drizzle ORM + schéma PostgreSQL/PostGIS
- Mode démo in-memory (sans DB obligatoire)
- Docker Compose PostgreSQL pour dev local
- Script seed `pnpm db:seed`

#### Tests
- Vitest : calculs investissement, parseur recherche, conversion devises

#### Documentation
- 13 documents techniques dans `/docs/`
- Audit concurrentiel Holding IMMO
- README setup complet

#### Pages légales
- Mentions légales, politique de confidentialité, CGU
- Page À propos et Contact

### Limitations connues

- Pas de LLM production (parseur regex local uniquement)
- Auth démo avec mots de passe en clair dans `demo-data.ts`
- Repository listings en mémoire (PostgreSQL optionnel non branché au runtime)
- Upload média non implémenté (images Unsplash)
- Favoris non persistés en base
- RLS Supabase non activé
- Email transactionnel non configuré

### Comptes démo

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@darbladi.demo` | `Admin123!` | admin |
| `agent@darbladi.demo` | `Agent123!` | agent |
| `acheteur@darbladi.demo` | `Acheteur123!` | buyer |

---

## [Unreleased]

### Prévu Phase 2
- Connexion repository PostgreSQL
- Supabase Auth
- RLS policies
- Upload images Supabase Storage
- Favoris persistants

---

[0.1.0]: https://github.com/darbladi/darbladi/releases/tag/v0.1.0
