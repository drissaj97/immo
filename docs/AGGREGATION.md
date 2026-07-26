# DarBladi — Agrégation multi-sources

> Vision : **Toutes les annonces immobilières du Maroc, en un seul endroit.**

## Principe

DarBladi est un **index agrégé**, pas un scrapeur. Chaque annonce affiche :

- Sa **source** (Avito, Mubawab, Holding IMMO, DarBladi…)
- Un **lien vers l'annonce originale**
- Son **statut de licence** (first-party, contrat partenaire, API licenciée)

## Sources supportées

| Source | Statut actuel | Activation |
|--------|---------------|------------|
| Holding IMMO | ✅ Actif (50 annonces, ~21 photos/annonce) | Import JSON-LD + HTML + téléchargement photos |
| SEMSAR AI | ✅ Actif (import API, ~73k dispo) | `pnpm import:semsarai` — défaut 500 annonces |
| DarBladi | ⏸ Plateforme | Publications directes via PostgreSQL (pas de données fictives) |
| Avito.ma | ⏳ Partenariat requis | Voir ci-dessous |
| Mubawab.ma | ⏳ Partenariat requis | Voir ci-dessous |
| Sarouty.ma | ⏳ Partenariat requis | Contrat à négocier |

## ⚠️ Scraping direct (non partenaire)

Les CGU d'Avito et Mubawab **interdisent l'extraction automatisée** sans autorisation.
DarBladi propose un mode scraping **opt-in** pour les cas où vous acceptez ce risque :

```bash
# Limiter la charge — commencer petit
SCRAPE_PORTALS=sarouty,mubawab SCRAPE_MAX_LISTINGS=100 pnpm scrape:portals
SCRAPING_ENABLED=true pnpm aggregation:sync
```

| Portail | Méthode | Notes |
|---------|---------|-------|
| Sarouty | API `b2c-be-prod.api.sarouty.ma` | ~51k annonces, fiable |
| Mubawab | JSON-LD sur fiches `/fr/a/{id}` | Seeds depuis catalogue SEMSAR |
| Avito | Playwright + proxy résidentiel | Cloudflare bloque les IP datacenter |

## Voies conformes pour Avito & Mubawab

### 1. Partenariat commercial (recommandé)

- **Avito** : contacter l'équipe Boutiques Immo / partenariats B2B
- **Mubawab** : contacter Dubizzle Group (EMPG) pour un flux XML/JSON partenaire

Une fois le contrat signé :

```bash
# Option A — URL flux sécurisé
AVITO_PARTNER_FEED_URL=https://partner.avito.ma/feed/darbladi.json
MUBAWAB_PARTNER_FEED_URL=https://...

# Option B — fichier local
cp export-avito.json data/feeds/avito.json
pnpm aggregation:sync
```

### 2. PropAPIS (agrégateur licencié)

Service tiers avec accès API licencié aux portails MENA :

```env
PROPAPIS_API_KEY=your_key
PROPAPIS_CITIES=casablanca,rabat,marrakech,tanger,agadir,fes,kenitra
```

### 3. Import manuel partenaire

Format JSON documenté dans `data/feeds/README.md`.

## Architecture technique

```
src/lib/aggregation/
├── types.ts           # Types normalisés
├── normalizer.ts      # Mapping → DemoListing
├── dedupe.ts          # Déduplication cross-source
├── sync.ts            # Orchestration
└── sources/
    ├── holding-source.ts
    ├── partner-feed.ts
    ├── propapis-source.ts
    └── registry.ts
```

## Commandes

```bash
pnpm aggregation:sync          # Sync toutes les sources
pnpm import:semsarai           # Import semsarai.ma (API + photos)
SEMSARAI_IMPORT_LIMIT=500 pnpm import:semsarai
SEMSARAI_LIVE_SYNC=true pnpm dev   # complète via API (cache 15 min)
pnpm import:holding            # Re-import Holding IMMO + téléchargement photos
pnpm import:holding -- --no-download  # Métadonnées seulement (URLs distantes)
curl /api/v1/aggregation/status # Stats JSON
POST /api/v1/cron/aggregation   # Cron (CRON_SECRET)
```

### Import photos Holding IMMO (first-party)

Le script `scripts/import-holding-immo.ts` :

1. Parse le sitemap + JSON-LD de chaque fiche
2. **Extrait toutes les photos** depuis le HTML (`/storage/uploads/`, `/storage/properties/`)
3. **Télécharge** les fichiers dans `public/media/holding/{reference}/`
4. Met à jour `src/lib/data/holding-listings.ts` avec les chemins locaux (`/media/holding/...`)
5. Génère un manifeste audit : `data/media/holding-manifest.json`

Après un clone du repo, relancer `pnpm import:holding` pour récupérer les photos (~800 Mo).

## Déduplication

Priorité en cas de doublon :

1. First-party (Holding IMMO, DarBladi)
2. Contrat partenaire
3. API licenciée

## Prochaines étapes

- [ ] Signature partenariat Avito Group
- [ ] Signature partenariat Dubizzle Group / Mubawab
- [x] Index pgvector sur catalogue agrégé (cron + seed)
- [ ] Alertes cross-sources (« même bien moins cher sur… »)
