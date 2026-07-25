# DarBladi — Stratégie SEO et GEO

## Objectifs

1. Indexer le catalogue démo et les pages transactionnelles (acheter, louer, investir)
2. Générer du trafic organique qualifié sur le marché immobilier marocain
3. Préparer les pages programmatiques ville/quartier/type
4. Optimiser la visibilité locale (GEO) pour Marrakech, Rabat, Casablanca, etc.

## Architecture SEO technique

### Server-Side Rendering (SSR)

- Pages catalogue et fiches en **Server Components** Next.js App Router
- `generateMetadata()` sur chaque page clé pour titres/descriptions uniques
- Helper centralisé : `src/lib/seo/metadata.ts`

```typescript
buildMetadata({ title, description, path, locale })
// → title, description, canonical, hreflang fr/en/ar, OpenGraph, Twitter
```

### Sitemap

Fichier : `src/app/sitemap.ts`

**Inclus :**
- Pages statiques × 3 locales (fr, en, ar) : accueil, acheter, louer, neuf, biens, carte, investir, simulateur, darbladi, comparer
- Fiches biens publiées (`status: published`) × 3 locales

**Priorités :**
| Type | priority | changeFrequency |
|------|----------|-----------------|
| Accueil | 1.0 | daily |
| Pages transaction | 0.8 | weekly |
| Fiches bien | 0.7 | weekly |

**URL pattern :** `{APP_URL}/{locale}/biens/{slug}`

### Robots.txt

Fichier : `src/app/robots.ts`

```
Allow: /
Disallow: /admin/, /api/, /connexion/, /dashboard/
Sitemap: {APP_URL}/sitemap.xml
```

### Données structurées

Helper `listingJsonLd()` génère Schema.org `RealEstateListing` :

- `@type`: RealEstateListing
- `offers.price`, `offers.priceCurrency`
- `address.addressLocality`, `addressCountry: MA`
- `image`, `url`

À intégrer via `<script type="application/ld+json">` sur fiches bien.

## Stratégie de contenu

### Pages piliers (MVP)

| Page | Requête cible | Intent |
|------|---------------|--------|
| `/fr/acheter` | acheter appartement Marrakech | Transactionnel |
| `/fr/louer` | location longue durée Rabat | Transactionnel |
| `/fr/investir` | investir immobilier Maroc | Informationnel + transactionnel |
| `/fr/simulateur-rentabilite` | simulateur rendement locatif | Outil |
| `/fr/darbladi` | recherche immobilière IA Maroc | Différenciation |
| `/fr/a-propos` | marketplace immobilière Maroc | Confiance |

### Slugs biens

Pattern : `{type}-{caracteristiques}-{quartier}-{ville}`

Exemple : `appartement-f3-gueliz-vue-atlas-marrakech`

Règles :
- Minuscules, tirets, sans accents dans slug URL
- Descriptif mais concis (< 80 caractères)
- Unique (contrainte DB `slug` unique)

## Pages programmatiques (roadmap)

### Règles de génération

| Template | URL | Condition indexation |
|----------|-----|---------------------|
| Ville | `/{locale}/acheter/{ville}` | ≥ 5 biens publiés |
| Quartier | `/{locale}/acheter/{ville}/{quartier}` | ≥ 3 biens |
| Type + ville | `/{locale}/acheter/{ville}/{type}` | ≥ 3 biens |
| Transaction | `/{locale}/louer/{ville}` | ≥ 3 biens location |

### Contenu minimum par page GEO

- H1 unique : « Acheter un appartement à Guéliz, Marrakech »
- Paragraphe éditorial 150–300 mots (pas de duplicate content)
- Compteur biens + grille filtrée
- Liens internes vers quartiers adjacents
- Breadcrumb : Accueil > Acheter > Marrakech > Guéliz

### Pages à ne pas indexer

- Résultats recherche avec > 3 paramètres query (`noindex, follow`)
- Pages comparateur vides
- Dashboard, admin, auth
- Pagination > page 5 (canonical vers page 1 ou self)

## Internationalisation SEO

| Locale | hreflang | Direction |
|--------|----------|-----------|
| `fr` | `fr-MA` (défaut) | LTR |
| `en` | `en` | LTR |
| `ar` | `ar-MA` | RTL |

Balises `alternates.languages` dans metadata :
```typescript
alternates: {
  canonical: url,
  languages: { fr: '.../fr...', en: '.../en...', ar: '.../ar...' }
}
```

## GEO (référencement local)

### Villes couvertes MVP

Marrakech, Rabat, Casablanca, Salé, Tanger, Kénitra, Bouznika

### Signaux locaux

- Coordonnées GPS sur fiches (`latitude`, `longitude`)
- Carte MapLibre par bien et page `/carte`
- Quartiers nommés (Guéliz, Amelkis, Hay Riad, Technopolis…)
- `addressCountry: MA` dans JSON-LD
- Contenu FR/AR adapté au marché local

### Google Business Profile

- Profil entreprise DarBladi (Phase 2 marketing)
- Lien vers site + pages ville

## Performance Core Web Vitals

- Images Next.js Image / lazy loading
- Fonts optimisées via `next/font`
- Pas de JS bloquant sur pages catalogue SSR
- Carte chargée client-side uniquement

## Checklist pré-production

- [ ] `NEXT_PUBLIC_APP_URL` = domaine production
- [ ] Sitemap accessible (pas d'erreur 500 — leçon audit Holding IMMO)
- [ ] Canonical cohérents sans trailing slash mixte
- [ ] JSON-LD validé (Google Rich Results Test)
- [ ] hreflang réciproques fr/en/ar
- [ ] robots.txt testé
- [ ] Pages légales indexables

## Métriques

- Impressions / clics Search Console par template
- Position moyenne requêtes « acheter + ville »
- Taux indexation sitemap
- CTR fiches bien vs pages liste

## Références

- Metadata : `src/lib/seo/metadata.ts`
- Sitemap : `src/app/sitemap.ts`
- Robots : `src/app/robots.ts`
