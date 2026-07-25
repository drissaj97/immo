# Changelog

Toutes les modifications notables du projet Samsar IA sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).  
Versionnement sémantique : [SemVer](https://semver.org/lang/fr/).

---

## [0.1.0] — 2026-07-25

### 🎉 Release initiale MVP

Première version publique de démonstration de la plateforme immobilière intelligente Samsar IA, ciblant le marché marocain.

### Ajouté

#### Parcours utilisateur
- Page d'accueil avec hero, recherche rapide et sélection de biens
- Catalogue `/acheter`, `/louer`, `/neuf` avec filtres avancés
- Fiches bien `/biens/[slug]` avec galerie, caractéristiques et carte
- Comparateur multi-biens (jusqu'à 3)
- Carte interactive MapLibre `/carte`
- Section investissement `/investir` et simulateur `/simulateur-rentabilite`
- Assistant Samsar IA `/samsar-ia` (recherche en langage naturel)

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
| `admin@samsar-ia.demo` | `Admin123!` | admin |
| `agent@samsar-ia.demo` | `Agent123!` | agent |
| `acheteur@samsar-ia.demo` | `Acheteur123!` | buyer |

---

## [Unreleased]

### Prévu Phase 2
- Connexion repository PostgreSQL
- Supabase Auth
- RLS policies
- Upload images Supabase Storage
- Favoris persistants

---

[0.1.0]: https://github.com/samsar-ia/samsar-ia/releases/tag/v0.1.0
