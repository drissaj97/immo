# Flux partenaires — agrégation DarBladi

Déposez ici les exports JSON **autorisés par contrat** depuis Avito, Mubawab ou autres portails.

## Format (`avito.json`, `mubawab.json`)

```json
{
  "source": "avito",
  "licenseRef": "CONTRAT-2026-XXX",
  "licenseStatus": "partner_contract",
  "syncedAt": "2026-07-25T12:00:00Z",
  "listings": [
    {
      "externalId": "12345678",
      "title": "Appartement F3 — Casablanca",
      "price": 1200000,
      "currency": "MAD",
      "transactionType": "sale",
      "listingType": "apartment",
      "city": "Casablanca",
      "neighborhood": "Anfa",
      "livingArea": 95,
      "bedrooms": 2,
      "sourceUrl": "https://www.avito.ma/fr/...",
      "images": ["https://..."]
    }
  ]
}
```

## Activation

1. **Contrat partenaire** — contact commercial Avito / Mubawab
2. **Ou PropAPIS** — `PROPAPIS_API_KEY` dans `.env.local` (agrégateur licencié)
3. **Ou URL flux** — `AVITO_PARTNER_FEED_URL`, `MUBAWAB_PARTNER_FEED_URL`

## Sync

```bash
pnpm aggregation:sync
# ou cron POST /api/v1/cron/aggregation
```

## Conformité

Le scraping non autorisé est **interdit**. Voir `docs/AGGREGATION.md`.
