# DarBladi Mobile (Expo)

Application React Native consommant l'API partenaires DarBladi v1.

## Prérequis

- Node.js 20+
- Expo CLI (`npx expo`)
- API DarBladi en cours d'exécution (`pnpm dev` à la racine du monorepo)

## Configuration

Variables d'environnement (`.env` ou `app.config.js`) :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `EXPO_PUBLIC_API_URL` | URL de l'API | `http://localhost:3000` |
| `EXPO_PUBLIC_PARTNER_API_KEY` | Clé partenaire | `darbladi-demo-partner-key` |

## Lancement

```bash
cd mobile
npm install
npx expo start
```

Scannez le QR code avec Expo Go (iOS/Android) ou lancez un simulateur.

## Écrans

- **Liste des biens** — catalogue via `GET /api/v1/listings`
- **Détail bien** — fiche résumée avec prix, localisation, statut vérifié

## Roadmap mobile

- [ ] Authentification JWT
- [ ] Assistant IA intégré
- [ ] Favoris synchronisés
- [ ] Notifications push alertes recherche
