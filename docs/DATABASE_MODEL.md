# Samsar IA — Modèle de données

> Schéma source de vérité : [`src/lib/db/schema.ts`](../src/lib/db/schema.ts)  
> Migration SQL initiale : [`supabase/migrations/0000_init.sql`](../supabase/migrations/0000_init.sql)

## Diagramme entité-relation

```mermaid
erDiagram
    users ||--o| profiles : "1:1"
    users ||--o{ listings : "owner"
    users ||--o{ favorites : "has"
    users ||--o{ audit_logs : "performs"

    locations ||--o{ listings : "located_in"

    listings ||--o{ listing_media : "has"

    listings ||--o{ favorites : "favorited_by"

    users {
        uuid id PK
        varchar email UK
        text password_hash
        user_role role
        varchar locale
        currency currency
        timestamp created_at
        timestamp updated_at
    }

    profiles {
        uuid id PK
        uuid user_id FK
        varchar full_name
        varchar phone
        boolean is_verified
        boolean is_demo
    }

    locations {
        uuid id PK
        varchar country
        varchar region
        varchar city
        varchar district
        varchar neighborhood
        decimal latitude
        decimal longitude
        varchar slug UK
    }

    listings {
        uuid id PK
        varchar slug UK
        text title
        text description
        transaction_type transaction_type
        listing_type listing_type
        listing_status status
        integer price
        currency currency
        integer living_area
        integer land_area
        integer bedrooms
        integer bathrooms
        boolean has_pool
        boolean has_parking
        boolean is_verified
        boolean is_demo
        uuid location_id FK
        uuid owner_id FK
        varchar source_type
        varchar source_name
        timestamp published_at
        integer completeness_score
        integer freshness_score
    }

    listing_media {
        uuid id PK
        uuid listing_id FK
        text url
        text alt
        integer sort_order
        boolean is_demo
    }

    favorites {
        uuid id PK
        uuid user_id FK
        uuid listing_id FK
        timestamp created_at
    }

    exchange_rates {
        uuid id PK
        currency from_currency
        currency to_currency
        decimal rate
        varchar source
        timestamp rate_date
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        jsonb metadata
        timestamp created_at
    }
```

## Énumérations

### `user_role`

| Valeur | Description |
|--------|-------------|
| `visitor` | Non authentifié (implicite) |
| `buyer` | Acheteur particulier |
| `investor` | Investisseur |
| `agent` | Agent commercial |
| `agency_admin` | Responsable agence |
| `developer` | Promoteur |
| `admin` | Administrateur plateforme |

### `listing_type`

`apartment`, `villa`, `riad`, `land`, `commercial`, `office`

### `transaction_type`

`sale`, `long_term_rent`, `seasonal_rent`

### `listing_status`

| Statut | Description |
|--------|-------------|
| `draft` | Brouillon non soumis |
| `pending_review` | En attente modération |
| `published` | Visible publiquement |
| `archived` | Retiré du catalogue |
| `rejected` | Refusé par admin |

### `currency`

`MAD`, `EUR`, `USD`

## Entités détaillées

### `users`

Comptes authentifiés. Mot de passe hashé (`password_hash`). Préférences locale et devise.

**Index :** `email` unique.

### `profiles`

Extension 1:1 du user : nom, téléphone, badges vérification. `is_demo` pour comptes de démonstration.

### `locations`

Référentiel géographique hiérarchique : pays → région → ville → quartier. Slug unique pour URLs programmatiques futures (`marrakech/gueliz`).

**Index :** `locations_city_idx` sur `city`.

### `listings`

Entité centrale. Champs principaux :

- **Commercial** : `price`, `currency`, `transactionType`, `listingType`
- **Physique** : surfaces, chambres, équipements (pool, parking, jardin…)
- **Provenance** : `sourceType`, `sourceName`, `sourceUrl`, `externalId`, `firstSeenAt`, `lastSeenAt`
- **Qualité** : `completenessScore`, `freshnessScore`, `isVerified`
- **Géo** : `locationId` + coordonnées dénormalisées `latitude`/`longitude`
- **Cycle de vie** : `status`, `publishedAt`, `ownerId`

**Index :** `listings_status_idx`, `listings_city_price_idx`, `listings_transaction_idx`.

### `listing_media`

Galerie photos par annonce. Ordre via `sortOrder`. Cascade delete avec listing.

### `favorites`

Association user ↔ listing. Index sur `userId`.

### `exchange_rates`

Historique taux de change pour conversion affichage. Source documentée (`source`, `rateDate`).

### `audit_logs`

Journal actions admin et sensibles. Métadonnées JSON flexibles.

## Relations clés

```
users (1) ──→ (0..1) profiles
users (1) ──→ (0..n) listings [owner_id]
users (1) ──→ (0..n) favorites
locations (1) ──→ (0..n) listings [location_id]
listings (1) ──→ (0..n) listing_media
listings (1) ──→ (0..n) favorites
```

## Extensions PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
-- pgvector prévu Phase 3
```

## Correspondance démo ↔ schéma

| Démo (`demo-data.ts`) | Table |
|----------------------|-------|
| `DemoListing.location` | `locations` + FK `listings.location_id` |
| `DemoListing.images[]` | `listing_media` (1 row / image) |
| `DEMO_USERS` | `users` + `profiles` |
| `EXCHANGE_RATES` | `exchange_rates` |

## Seed

Le script `scripts/seed.ts` peuple PostgreSQL depuis `demo-data.ts` avec `onConflictDoNothing()` et `isDemo: true` sur toutes les entités.

## Évolutions prévues (hors MVP)

- Table `agencies` (1:n agents)
- Table `programs` (promoteur → lots neufs)
- Table `leads` (demandes de contact)
- Table `saved_searches` (alertes)
- Embeddings vectoriels sur `listings.description`
