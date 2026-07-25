# Audit public — Holding IMMO (holdingimmo.com)

> Audit réalisé le 25 juillet 2026. Sources : navigation publique uniquement, sans contournement d'authentification ni collecte massive.

## Méthodologie

- Consultation des pages publiques (accueil, achat, fiche bien)
- Lecture de `robots.txt`
- Analyse des en-têtes HTTP et du HTML initial
- Tentative d'accès au sitemap (erreur serveur observée)

## Ce qui est observé

### Navigation et arborescence

| Section | URL observée | Contenu |
|---------|--------------|---------|
| Accueil | `/` | Hero immersif, recherche rapide, sélection de biens, quartiers, services |
| Achat | `/acheter` | Liste filtrable (~107 biens), tri, grille |
| Fiche bien | `/biens/[slug]` | Galerie, prix, caractéristiques, équipements, carte, contact agent |
| Favoris | `/favoris` | (lien header, contenu non audité en détail) |
| Connexion | `/connexion` | Bloqué dans robots.txt |
| Compte | `/compte/` | Bloqué dans robots.txt |

### Fonctionnalités UX observées

- **Langues** : FR / EN (sélecteur header)
- **Devises** : MAD / EUR / USD
- **Unités** : m² / sqft
- **Recherche hero** : ville, type, secteur/quartier, budget, onglets Acheter/Louer
- **Filtres liste** : type, quartier, budget, tri (récents, prix, surface)
- **Cartes bien** : photo large, prix, chambres, SDB, surface, référence (ex. HI111)
- **Badges** : « À Vendre », « Exclusivité »
- **Fiche** : galerie photos, description longue, équipements, localisation, formulaire contact, agent assigné
- **Quartiers** : pages descriptives avec compteur de biens (ex. Amelkis, 41 biens)

### Structure des URL

- Slugs SEO descriptifs : `/biens/villa-dexception-golf-amelkis-avec-piscine-chauffee-a-marrakech`
- Pattern cohérent : type + localisation + caractéristiques

### SEO et métadonnées

- Titres descriptifs par page (« Agence Immobilière Marrakech — Villas, Riads & Appartements de Luxe »)
- `robots.txt` : disallow `/admin/`, `/api/`, auth, compte
- Sitemap déclaré : `https://holdingimmo.com/sitemap.xml` (retourne HTTP 500 au moment de l'audit)
- Données structurées Schema.org : **non confirmées** dans l'échantillon HTML analysé

### Images

- Optimisation via `/_next/image` (Next.js Image)
- Stockage propriétaire : `/storage/uploads/` et `/storage/properties/{ref}/photo-XX.jpeg`
- Hero et placeholders : Unsplash (`images.unsplash.com`)
- Placeholder interne : `/images/placeholder-property.jpg`

### Technologies détectées (niveau de confiance : élevé)

| Signal | Détection |
|--------|-----------|
| `/_next/static/`, `/_next/image` | **Next.js** (App Router probable) |
| Classes CSS `inter_*`, `cormorant_garamond_*` | **Inter** + **Cormorant Garamond** (Google Fonts) |
| En-tête `x-powered-by: PleskLin` | Hébergement **Plesk** / nginx |
| Références HI### | Système de références internes |

### Origine probable des annonces

| Hypothèse | Confiance | Indices |
|-----------|-----------|---------|
| Back-office propriétaire alimentant une base interne | **Élevée** | Références HI### cohérentes, chemins `/storage/properties/{slug-ref}/`, agents nommés, badge exclusivité |
| CMS headless ou admin custom | **Moyen** | Structure Next.js + stockage fichier organisé par référence |
| Import/synchronisation CRM | **Moyen** | Volume homogène, métadonnées structurées, pas de marqueur portail tiers visible |
| Flux XML/JSON externe (portails) | **Faible** | Aucun identifiant externe Avito/Mubawab visible sur l'échantillon |
| Scraping de portails tiers | **Faible** | Photos hébergées localement, rédaction éditoriale homogène |
| Saisie manuelle seule | **Faible** | Volume (~107 biens achat) et structure media suggèrent un pipeline semi-automatisé |

**Ce qui ne peut pas être déterminé** : schéma exact de la base, CRM utilisé, existence d'API partenaires, fréquence de synchronisation.

## Ce qui peut être repris comme principe UX (sans copier)

- Hero immersif avec recherche intégrée
- Typographie éditoriale pour titres + sans-serif pour UI
- Grandes photos, espaces généreux
- Cartes de biens sobres avec référence et localisation
- Filtres par quartier avec compteurs
- Pages quartiers avec description éditoriale
- Sélecteurs langue / devise / unités persistants
- Fiche bien structurée (galerie → prix → caractéristiques → équipements → contact)
- Sentiment premium et rassurant

## Ce qui ne doit pas être reproduit

- Logo, nom, identité graphique exacte Holding IMMO
- Textes, descriptions et photos propriétaires
- Références HI### et données réelles
- Palette exacte du site source
- Contenus agents réels (ex. noms, téléphones observés)

## Implications pour Samsar IA

1. **Différenciation** : marketplace multi-acteurs + IA + investissement, pas agence mono-marque
2. **Données** : provenance explicite, `is_demo`, pas de scraping non autorisé
3. **SEO** : sitemap fonctionnel dès le MVP (point faible observé chez la référence)
4. **Stack** : Next.js confirmé comme choix pertinent pour ce segment premium
