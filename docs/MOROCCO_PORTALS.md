# Portails immobiliers Maroc — inventaire DarBladi

Objectif : indexer le maximum d’annonces utiles au Maroc, avec **provenance** et **lien source**.

## Tier 1 — scrape `pnpm scrape:portals`

| Portail | Méthode | Infos récupérées | Commande ciblée |
|---------|---------|------------------|-----------------|
| **Sarouty.ma** | API publique | titre, prix, ville, quartier, surface, chambres, photos, agent | `--portals=sarouty` |
| **Mubawab.ma** | JSON-LD fiches | offre complète schema.org | `--portals=mubawab` |
| **Avito.ma** | Playwright `__NEXT_DATA__` | fiche Next.js (proxy recommandé) | `--portals=avito` |
| **Agenz.ma** | HTML + props Astro | prix, surface, typologie, SDB, photos, **téléphone** | `--portals=agenz` |
| **Yakeey** | HTML + meta/RSC | prix, surface, chambres, ville/quartier, photos | `--portals=yakeey` |

```bash
# Turbo (défaut) — delay=0, portails + pages en parallèle, keep-alive HTTP
pnpm scrape:portals --fast
SCRAPE_MAX_LISTINGS=500 pnpm scrape:portals --portals=agenz,yakeey,sarouty

# Forcer concurrence / connexions
SCRAPE_CONCURRENCY=48 SCRAPE_HTTP_CONNECTIONS=128 pnpm scrape:portals --fast

# Mode prudent (délais + concurrence basse)
pnpm scrape:portals --polite

# Activer dans le catalogue
SCRAPING_ENABLED=true pnpm aggregation:sync
```

Feeds écrits dans `data/feeds/{source}.json`.

## Tier 2 — couverture / roadmap

| Portail | Statut | Notes |
|---------|--------|-------|
| SemsarAI | ✅ Import API (`pnpm import:semsarai`) | Agrégateur — déjà dans le catalogue |
| Holding IMMO | ✅ First-party | Import JSON-LD autorisé |
| Property Finder MA | ⏳ Probe | Volume Maroc à confirmer |
| Bayut | ⏳ Probe | Focus MENA, Maroc limité |
| Jibli.ma | ⏳ Probe | Annonces locales |

## Tier 3 — hors scope immo

| Site | Raison |
|------|--------|
| Wandaloo | Auto / véhicules |

## Performance (turbo)

| Réglage | Défaut turbo | Rôle |
|---------|--------------|------|
| `SCRAPE_FAST` | `true` | delay=0 + concurrence haute |
| `SCRAPE_DELAY_MS` | `0` | **aucune** latence artificielle |
| `SCRAPE_PARALLEL` | on | tous les portails en même temps |
| `SCRAPE_CONCURRENCY` | 32 | workers fiches (override global) |
| `SCRAPE_SEARCH_CONCURRENCY` | 20 | pages recherche en parallèle |
| `SCRAPE_SAROUTY_CONCURRENCY` | 24 | pages API Sarouty en parallèle |
| `SCRAPE_HTTP_CONNECTIONS` | 96 | pool undici keep-alive |

Découverte (seeds villes × pages) et fiches détail sont fan-out via `mapPool` — plus de boucles séquentielles.

## Conformité

Le scraping direct reste **opt-in** et risque juridique (CGU des portails).  
Voir `docs/DATA_SOURCES_AND_COMPLIANCE.md` et `docs/AGGREGATION.md`.  
Préférer contrats partenaires / PropAPIS en production.
