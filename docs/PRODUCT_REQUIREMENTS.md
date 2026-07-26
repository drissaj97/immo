# DarBladi — Exigences produit (MVP v0.1.0)

## Vision

DarBladi est une plateforme immobilière premium au Maroc qui combine recherche de biens, analyse d'investissement et assistant conversationnel. Elle se distingue des agences mono-marque par une approche **marketplace multi-acteurs**, une **provenance explicite des données** et des outils d'aide à la décision pour investisseurs et acheteurs.

**Tagline :** *Rechercher, comprendre et sécuriser votre décision immobilière.*

## Proposition de valeur par persona

| Persona | Besoin principal | Valeur DarBladi |
|---------|------------------|------------------|
| **Investisseur** | Rendement, cash-flow, scénarios | Simulateur de rentabilité, filtres investissement, comparaison multi-biens, assistant IA orienté rendement |
| **Acheteur** | Trouver le bon bien, rassurance | Recherche avancée, fiches détaillées, carte, favoris, multidevise (MAD/EUR/USD) |
| **DarBladi (utilisateur assistant)** | Recherche en langage naturel | Parseur conversationnel → filtres structurés, transparence sur hypothèses et champs manquants |
| **Agence / Agent** | Diffuser des annonces qualifiées | Publication soumise à validation, références SA-*, dashboard professionnel |
| **Promoteur** | Vendre du neuf, programmes | Section « Neuf », badge programme, champs `isNew` |
| **Admin** | Modération, conformité | Back-office validation/rejet, traçabilité `audit_logs`, contrôle `is_demo` |

## Périmètre MVP (v0.1.0)

### Inclus

- **Parcours public** : accueil, achat, location, neuf, carte, investissement, comparateur, simulateur
- **Catalogue démo** : ~15 biens fictifs (Marrakech, Rabat, Casablanca, Salé, Tanger, Kénitra, Bouznika)
- **Recherche** : filtres classiques + recherche conversationnelle (mode mock sans LLM)
- **Fiches bien** : galerie, caractéristiques, JSON-LD Schema.org, slugs SEO
- **Comparaison** : jusqu'à 3 biens côte à côte
- **Simulateur** : calculs rendement brut/net, cash-flow, scénarios prudent/central/optimiste
- **Auth démo** : JWT local, comptes préconfigurés (admin, agent, acheteur)
- **Publication** : création d'annonce → statut `pending_review` → validation admin
- **i18n** : FR (défaut), EN, AR (RTL)
- **SEO** : SSR App Router, sitemap.xml, robots.txt, métadonnées Open Graph
- **Mode démo** : données in-memory sans PostgreSQL obligatoire

### Hors périmètre MVP

- Paiement en ligne, signature électronique, CRM complet
- Scraping ou import automatique de portails tiers
- LLM production (OpenAI branché mais non activé)
- Supabase Auth / RLS en production
- Notifications email transactionnelles
- Upload média propriétaire (images Unsplash en démo)
- Applications mobiles natives

## Critères de succès MVP

1. Un visiteur peut rechercher, consulter une fiche et comparer des biens en < 3 clics depuis l'accueil
2. Un investisseur obtient rendement net et cash-flow mensuel via le simulateur
3. Un agent peut soumettre une annonce et un admin la publier ou la rejeter
4. La recherche IA retourne des filtres structurés avec hypothèses explicites
5. Le sitemap est fonctionnel (contrairement à certaines références auditées)
6. Toutes les annonces portent `isDemo: true` et une mention légale visible

## Contraintes non fonctionnelles

- **Conformité** : Loi 09-08 (Maroc), RGPD pour utilisateurs UE, pas de scraping non autorisé
- **Performance** : pages catalogue en SSR, images optimisées Next.js
- **Sécurité** : cookies HttpOnly, secrets en variables d'environnement, routes admin protégées
- **Accessibilité** : structure sémantique, support RTL pour l'arabe

## Métriques cibles (post-MVP)

- Taux de conversion recherche → fiche consultée
- Utilisation simulateur / comparateur
- Annonces soumises vs publiées (taux de validation)
- Requêtes assistant IA / session

## Références internes

- Audit concurrentiel : [`AUDIT_HOLDINGIMMO.md`](./AUDIT_HOLDINGIMMO.md)
- Personas : [`USER_PERSONAS.md`](./USER_PERSONAS.md)
- Flux : [`USER_FLOWS.md`](./USER_FLOWS.md)
