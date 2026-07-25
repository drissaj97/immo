# DarBladi — Sources de données et conformité

## Principes directeurs

1. **Provenance explicite** : chaque annonce porte `sourceType`, `sourceName`, `sourceUrl` (si applicable)
2. **Pas de scraping non autorisé** : aucune collecte automatisée de portails tiers sans accord écrit
3. **Marquage démo** : `isDemo: true` sur toutes les données MVP
4. **Traçabilité** : `firstSeenAt`, `lastSeenAt`, `externalId` pour imports futurs
5. **Audit concurrentiel** : voir [`AUDIT_HOLDINGIMMO.md`](./AUDIT_HOLDINGIMMO.md) — principes UX retenus, contenus propriétaires exclus

## Tableau des sources

| Source | Type | Statut | Usage MVP | Notes conformité |
|--------|------|--------|-----------|------------------|
| **Saisie first-party** | Annonces créées par utilisateurs plateforme | **Autorisée** | Publication agent/admin | Contrat CGU, validation modération |
| **Données démo internes** | `demo-data.ts` | **Autorisée** | Catalogue seed | Fictives, références SA-D*, Unsplash |
| **Holding IMMO (first-party)** | Import JSON-LD `holding-listings.ts` | **Autorisée** | Catalogue principal Marrakech | Migration agence sœur, `isDemo: false`, source tracée |
| **API partenaires agences** | Flux XML/JSON signé | **À vérifier** | Non implémenté | Nécessite contrat, DPA, droits diffusion |
| **Promoteurs (programmes neufs)** | Import manuel / API | **À vérifier** | Section `/neuf` démo | Mandat commercial requis |
| **Banque Al-Maghrib** | Taux de change officiels | **Autorisée** | Conversion EUR/USD | Source indicative, disclaimer affiché |
| **MapLibre demo tiles** | Tuiles cartographiques | **Autorisée** | Carte `/carte` | Remplacer par provider production |
| **Unsplash** | Photos placeholder | **Autorisée** | Images démo | Licence Unsplash, pas de biens réels |
| **OpenStreetMap / données ouvertes** | Géocodage, POI | **Autorisée** | Futur enrichissement | Respect licence ODbL |
| **Avito.ma** | Portail annonces | **À vérifier** (partenariat) | Flux partenaire / PropAPIS | Scraping interdit — contrat B2B requis |
| **Mubawab.ma** | Portail annonces | **À vérifier** (partenariat) | Flux partenaire / PropAPIS | Scraping interdit — contrat Dubizzle Group |
| **Sarouty.ma** | Portail annonces | **Interdite** (scraping) | — | Idem |
| **Holding IMMO / agences tierces** | Sites concurrents | **Interdite** (scraping) | — | Audit public uniquement, pas de reprise contenu |
| **Réseaux sociaux** | Posts, groupes FB | **Interdite** | — | Pas de collecte sans consentement |
| **Registres publics (ANCFCC)** | Titres fonciers | **À vérifier** | Futur badge `hasTitleDeed` | Accès réglementé, partenariat officiel requis |
| **OpenAI / LLM** | Traitement requêtes utilisateur | **À vérifier** | Mode mock MVP | DPA, pas de données personnelles dans prompts |

## Statuts expliqués

| Statut | Signification | Action |
|--------|---------------|--------|
| **Autorisée** | Utilisable dès le MVP ou avec attribution | Documenter source, afficher disclaimer si indicatif |
| **À vérifier** | Possible sous conditions | Validation juridique + contrat avant intégration |
| **Interdite** | Ne pas implémenter | Aucun scraper, crawler ou reprise de contenu |

## Champs de traçabilité (`listings`)

| Champ | Rôle |
|-------|------|
| `sourceType` | `first_party`, `agency`, `import`, `partner` |
| `sourceName` | Nom affiché (ex. « Agence Atlas Premium (fictive) ») |
| `sourceUrl` | URL canonique source (si import) |
| `externalId` | Identifiant chez le partenaire |
| `firstSeenAt` / `lastSeenAt` | Fraîcheur pour imports |
| `isDemo` | `true` = donnée fictive |
| `isVerified` | Validation manuelle ou documentaire |

## Conformité légale Maroc

### Loi 09-08 — Protection des données personnelles

- Consentement collecte email/téléphone
- Finalité limitée (compte, contact, alertes)
- Droit d'accès et rectification
- Hébergement et transferts documentés

Voir [`SECURITY.md`](./SECURITY.md) pour détails techniques.

### Obligations marketplace

- Mentions légales : `/mentions-legales`
- Politique confidentialité : `/confidentialite`
- CGU : `/conditions`
- Identification éditeur et hébergeur

## Conformité RGPD (utilisateurs UE/diaspora)

- Base légale : exécution contrat + intérêt légitime (analytics anonymisés)
- Registre des traitements (à formaliser Phase 2)
- Droit à l'effacement : suppression compte + favoris
- Pas de revente de données personnelles

## Checklist avant nouvelle source

- [ ] Statut juridique confirmé (autorisée / à vérifier)
- [ ] Contrat ou licence écrite
- [ ] Mapping champs → schéma Drizzle
- [ ] `sourceName` et attribution visibles
- [ ] Test doublons (`externalId` unique par source)
- [ ] Politique de rétention définie
- [ ] Entrée `audit_logs` pour imports massifs

## Affichage utilisateur

- Bannière globale si `DEMO_MODE=true` : *« Données de démonstration — ne constituent pas de vraies annonces. »*
- Par fiche : `sourceName`, référence `SA-*`, score complétude
- Taux de change : source + date + mention « indicatif »
