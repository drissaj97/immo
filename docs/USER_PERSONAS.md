# Samsar IA — Personas utilisateur

> Personas cibles pour le MVP v0.1.0. Les comptes démo correspondent aux rôles implémentés dans `src/lib/data/demo-data.ts`.

---

## 1. Karim — Investisseur patrimonial

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 42 ans, cadre supérieur, résident France, diaspora marocaine |
| **Objectif** | Acheter à Marrakech ou Rabat pour location longue durée + plus-value |
| **Frustrations** | Manque de transparence sur rendement réel, frais cachés, données non vérifiables |
| **Comportement** | Compare 5–10 biens, utilise simulateur, sensible au taux de change EUR/MAD |
| **Fonctionnalités clés** | `/investir`, `/simulateur-rentabilite`, `/comparer`, conversion devises |
| **Citation** | *« Je veux voir le cash-flow net avant d'appeler un notaire. »* |

---

## 2. Salma — Acheteuse résidence principale

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 34 ans, enseignante, Casablanca, première acquisition |
| **Objectif** | Appartement F3 proche écoles et transports à Rabat ou Salé |
| **Frustrations** | Annonces obsolètes, photos trompeuses, contact agent difficile |
| **Comportement** | Recherche par quartier, sauvegarde favoris, lit descriptions longues |
| **Fonctionnalités clés** | `/acheter`, `/biens`, favoris, fiche détaillée, carte |
| **Citation** | *« Je cherche un quartier calme avec commerces à pied. »* |

---

## 3. Youssef — Utilisateur Samsar IA

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 28 ans, digital native, peu de temps pour les filtres |
| **Objectif** | Formuler sa recherche en une phrase et obtenir des résultats pertinents |
| **Frustrations** | Formulaires complexes, jargon immobilier |
| **Comportement** | Utilise l'assistant conversationnel, accepte les suggestions de filtres |
| **Fonctionnalités clés** | `/samsar-ia`, API `/api/search/conversational` |
| **Citation** | *« F3 à Salé proche Technopolis pour moins de 1 300 000 DH »* |

---

## 4. Nadia — Directrice d'agence immobilière

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 48 ans, gère une agence à Marrakech, 8 agents |
| **Objectif** | Publier le portefeuille agence avec badge vérifié, visibilité premium |
| **Frustrations** | Portails généralistes peu qualitatifs, doublons d'annonces |
| **Comportement** | Publie via dashboard, suit statuts validation, exige traçabilité source |
| **Rôle système** | `agency_admin` ou `agent` |
| **Fonctionnalités clés** | `/dashboard/annonces/nouveau`, modération admin |
| **Compte démo** | `agent@samsar-ia.demo` |
| **Citation** | *« Mes annonces doivent refléter notre image haut de gamme. »* |

---

## 5. Mehdi — Agent commercial indépendant

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 31 ans, mandataire, spécialisé villas Amelkis |
| **Objectif** | Créer des annonces rapidement, obtenir des leads qualifiés |
| **Frustrations** | Délais de publication, rejet sans explication |
| **Comportement** | Saisie annonce minimale puis enrichissement, mobile-first |
| **Rôle système** | `agent` |
| **Fonctionnalités clés** | Création annonce, statut `pending_review` → `published` |
| **Citation** | *« Je veux publier en 5 minutes et savoir où en est ma demande. »* |

---

## 6. Amine — Promoteur immobilier

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 55 ans, promoteur programmes neufs Rabat-Salé-Kénitra |
| **Objectif** | Mettre en avant livraisons, plans de paiement, rendement locatif projeté |
| **Frustrations** | Confusion entre neuf et ancien sur les portails |
| **Comportement** | Publie lots par programme, met en avant `isNew` |
| **Rôle système** | `developer` |
| **Fonctionnalités clés** | `/neuf`, champs programme, simulateur avec scénarios |
| **Citation** | *« Mes acheteurs veulent comparer plusieurs lots du même programme. »* |

---

## 7. Fatima — Administratrice plateforme

| Attribut | Détail |
|----------|--------|
| **Âge / profil** | 38 ans, responsable conformité et modération |
| **Objectif** | Valider annonces, garantir `is_demo` / provenance, journaliser actions |
| **Frustrations** | Annonces incomplètes, sources douteuses |
| **Comportement** | File d'attente modération, approve/reject, audit |
| **Rôle système** | `admin` |
| **Fonctionnalités clés** | `/admin`, API approve/reject, `audit_logs` |
| **Compte démo** | `admin@samsar-ia.demo` |
| **Citation** | *« Aucune annonce sans source identifiable ne passe en production. »* |

---

## 8. Visiteur non connecté

| Attribut | Détail |
|----------|--------|
| **Profil** | Toute personne découvrant la plateforme via SEO ou bouche-à-oreille |
| **Objectif** | Explorer le catalogue, comprendre la proposition de valeur |
| **Limites MVP** | Pas de favoris persistants, pas de publication |
| **Rôle système** | `visitor` (implicite) |
| **Fonctionnalités clés** | Toutes les pages publiques, recherche, simulateur |
| **Citation** | *« Est-ce que ces données sont fiables ? »* → bannière démo visible |

---

## Matrice persona × rôle

| Persona | Rôle DB | Auth MVP |
|---------|---------|----------|
| Karim | `investor` | À venir (simulateur public) |
| Salma | `buyer` | `acheteur@samsar-ia.demo` |
| Youssef | — | Public |
| Nadia | `agency_admin` | Via `agent` démo |
| Mehdi | `agent` | `agent@samsar-ia.demo` |
| Amine | `developer` | À venir |
| Fatima | `admin` | `admin@samsar-ia.demo` |
| Visiteur | `visitor` | Non connecté |
