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
# Tous les portails scrapables (parallèle par défaut)
SCRAPE_MAX_LISTINGS=500 pnpm scrape:portals

# Rapide — Agenz + Yakeey seulement
SCRAPE_PORTALS=agenz,yakeey SCRAPE_MAX_LISTINGS=200 pnpm scrape:portals

# Séquentiel si besoin
SCRAPE_PARALLEL=false pnpm scrape:portals

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

## Performance

- Portails exécutés **en parallèle** (`SCRAPE_PARALLEL`, défaut on)
- Concurrence par source : `SCRAPE_AGENZ_CONCURRENCY`, `SCRAPE_YAKEEY_CONCURRENCY`, `SCRAPE_MUBAWAB_CONCURRENCY` (défaut 6–8)
- Seeds SEMSAR + pages recherche multi-villes pour maximiser la découverte
- Délai `SCRAPE_DELAY_MS` (défaut ~80 ms) pour limiter la charge

## Conformité

Le scraping direct reste **opt-in** et risque juridique (CGU des portails).  
Voir `docs/DATA_SOURCES_AND_COMPLIANCE.md` et `docs/AGGREGATION.md`.  
Préférer contrats partenaires / PropAPIS en production.
