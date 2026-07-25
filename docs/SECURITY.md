# DarBladi — Sécurité et conformité

## Cadre réglementaire

### Loi 09-08 (Maroc) — Protection des données à caractère personnel

| Exigence | Implémentation MVP | Phase suivante |
|----------|-------------------|----------------|
| Consentement | Checkbox inscription + politique confidentialité | Registre consentements |
| Finalité | Compte, favoris, publication annonces | Documentation DPO |
| Sécurité | HTTPS, hash mots de passe, cookies HttpOnly | Audit sécurité |
| Droits personnes | Contact email support | Portail self-service |
| Notification CNDP | — | Si traitement à risque |

### RGPD (utilisateurs UE / diaspora)

- Applicable aux utilisateurs résidant dans l'UE ou ciblés depuis l'UE
- Base légale : exécution du contrat (compte) + intérêt légitime (analytics anonymisés)
- Transferts hors UE : clauses contractuelles types si hébergement US (Vercel/OpenAI)
- Droit à l'effacement : suppression compte + données associées

## Authentification

### MVP (JWT local)

Fichier : `src/lib/auth/session.ts`

| Mesure | Détail |
|--------|--------|
| Hash mot de passe | bcrypt, cost factor 10 |
| Token | JWT HS256 via `jose`, expiration 7 jours |
| Cookie | `darbladi_session`, HttpOnly, Secure en production, SameSite=Lax |
| Secret | `AUTH_SECRET` ≥ 32 caractères (obligatoire prod) |

**Comptes démo** : mots de passe en clair dans `demo-data.ts` — **uniquement développement**.

### Migration Supabase Auth (Phase 2)

- Remplacement JWT maison
- OAuth (Google, Apple) optionnel
- MFA pour admins

## Autorisation

### Contrôle par rôle

```typescript
requireRole(user, ["admin"])           // Page /admin
["agent", "admin", "agency_admin"]     // POST /api/listings
```

### Routes protégées

| Route | Rôles autorisés |
|-------|-----------------|
| `/admin` | `admin` |
| `/dashboard/*` | Authentifié |
| `POST /api/listings` | `agent`, `agency_admin`, `admin` |
| `POST /api/admin/listings/*/approve` | `admin` |

### Évolution RLS (Row Level Security)

Politiques PostgreSQL prévues Supabase :

```sql
-- Exemple futur
CREATE POLICY listings_public_read ON listings
  FOR SELECT USING (status = 'published');

CREATE POLICY listings_owner_write ON listings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY listings_admin_all ON listings
  FOR ALL USING (auth.jwt()->>'role' = 'admin');
```

État MVP : **RLS non activé** — contrôle applicatif uniquement.

## Gestion des secrets

| Secret | Stockage | Rotation |
|--------|----------|----------|
| `AUTH_SECRET` | Vercel env / Supabase | Trimestrielle |
| `DATABASE_URL` | Vercel env (server-only) | À la compromission |
| `OPENAI_API_KEY` | Vercel env (server-only) | Trimestrielle |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env, jamais client | Trimestrielle |

**Règles :**
- Jamais committer `.env` (`.gitignore`)
- Variables `NEXT_PUBLIC_*` uniquement pour données publiques
- Service role key : server-side uniquement

## Protection applicative

### Headers (à configurer Vercel/next.config)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self)
```

### Rate limiting

- API auth : 10 req/min/IP (Phase 2)
- API IA : `AI_RATE_LIMIT_PER_MINUTE=20`
- API listings POST : 5 req/min/user

### Validation entrées

- Zod sur filtres recherche (`searchFiltersSchema`)
- Validation côté serveur sur POST listings
- Échappement XSS via React (pas de `dangerouslySetInnerHTML`)

## Données sensibles

| Donnée | Classification | Stockage |
|--------|---------------|----------|
| Email | PII | `users.email` |
| Téléphone | PII | `profiles.phone` |
| Mot de passe | Secret | `users.password_hash` |
| IP / logs | Technique | `audit_logs.metadata` |

### Rétention

- Comptes inactifs : suppression après 24 mois (politique à formaliser)
- Logs audit : 12 mois
- Données démo : pas de PII réelles

## Audit et traçabilité

Table `audit_logs` :
- Actions admin (approve, reject)
- Connexions suspectes (futur)
- Champs : `userId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`

## Infrastructure

### Vercel

- HTTPS automatique
- Isolation serverless
- Preview deployments isolés

### Supabase / PostgreSQL

- Connexion SSL (`?sslmode=require` en prod)
- Backups automatiques Supabase
- PostGIS : pas de données sensibles géo

### Docker local

- Mot de passe dev faible (`darbladi_dev`) — **local uniquement**
- Port 5432 non exposé en production

## Incident response

1. Révoquer secrets compromis (AUTH_SECRET, API keys)
2. Invalider sessions (rotation secret JWT)
3. Notification CNDP / CNIL si fuite PII (72h RGPD)
4. Post-mortem documenté

## Checklist production

- [ ] `AUTH_SECRET` aléatoire ≥ 32 chars
- [ ] `DEMO_MODE=false`
- [ ] Comptes démo supprimés ou désactivés
- [ ] HTTPS forcé
- [ ] RLS activé sur Supabase
- [ ] Backups testés
- [ ] Politique confidentialité à jour
- [ ] DPO / contact sécurité identifié

## Pages légales

| Page | Route |
|------|-------|
| Mentions légales | `/[locale]/mentions-legales` |
| Confidentialité | `/[locale]/confidentialite` |
| CGU | `/[locale]/conditions` |

## Références

- Sources données : [`DATA_SOURCES_AND_COMPLIANCE.md`](./DATA_SOURCES_AND_COMPLIANCE.md)
- Déploiement : [`DEPLOYMENT.md`](./DEPLOYMENT.md)
