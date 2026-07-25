# DarBladi — Architecture intelligence artificielle

## Objectif

Permettre la recherche immobilière en langage naturel tout en garantissant **contrôle**, **transparence** et **conformité** : pas d'hallucination de biens, pas d'actions non autorisées, traçabilité des hypothèses.

## État MVP (v0.1.0)

| Composant | Statut |
|-----------|--------|
| Parseur local (regex + alias) | ✅ Implémenté |
| API `/api/search/conversational` | ✅ Implémenté |
| UI `ConversationalSearch` | ✅ Implémenté |
| Abstraction `LLMProvider` | 📋 Prévu (module `modules/ai/`) |
| Appels OpenAI production | ⏸ Désactivé |

## Diagramme

```mermaid
flowchart TB
    UI[ConversationalSearch] --> API[POST /api/search/conversational]
    API --> Router{AI_PROVIDER}

    Router -->|mock| Parser[natural-language-parser.ts]
    Router -->|openai| LLM[LLMProvider]
    LLM --> Tools[Outils contrôlés]
    Tools --> Parser

    Parser --> Filters[SearchFilters Zod]
    Filters --> Response[JSON + assumptions + missing]
    Response --> UI
    UI -->|Appliquer| Biens[/biens?filters]
```

## Abstraction LLMProvider (cible)

Interface prévue pour Phase 2 :

```typescript
// modules/ai/llm-provider.ts (à implémenter)

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  readonly name: string;
  complete(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  structured<T>(schema: z.ZodType<T>, messages: LLMMessage[]): Promise<T>;
}

export type LLMOptions = {
  maxTokens?: number;
  temperature?: number;
  tools?: ControlledTool[];
};
```

### Implémentations prévues

| Provider | Classe | Variable env |
|----------|--------|--------------|
| Mock | `MockLLMProvider` | `AI_PROVIDER=mock` (défaut) |
| OpenAI | `OpenAILLMProvider` | `AI_PROVIDER=openai`, `OPENAI_API_KEY` |
| Anthropic | `AnthropicLLMProvider` | Futur |
| Local (Ollama) | `OllamaLLMProvider` | Futur dev offline |

### Factory

```typescript
export function createLLMProvider(): LLMProvider {
  switch (process.env.AI_PROVIDER) {
    case "openai":
      return new OpenAILLMProvider(process.env.OPENAI_API_KEY!);
    default:
      return new MockLLMProvider();
  }
}
```

## Mode mock (actuel)

Sans clé API, le flux utilise exclusivement `parseNaturalLanguageQuery()` :

- Extraction ville/quartier via alias (`CITY_ALIASES`)
- Détection type bien (villa, F3, riad…)
- Parsing budget MAD/EUR
- Inférence transaction (vente/location/saisonnier)
- Retour `assumptions[]` et `missing[]` pour transparence

Réponse API typique :

```json
{
  "filters": { "city": "Salé", "neighborhood": "Technopolis", "maxPrice": 1300000 },
  "assumptions": ["Type de transaction non précisé — recherche vente par défaut"],
  "missing": [],
  "mode": "mock",
  "note": "Mode démonstration — parseur local sans LLM"
}
```

## Liste d'outils contrôlés (whitelist)

Le LLM ne pourra invoquer **que** ces outils — pas d'accès DB direct, pas de HTTP arbitraire :

| Outil | Description | Paramètres | Effet |
|-------|-------------|------------|-------|
| `parse_search_query` | Convertit NL → filtres | `query: string` | Retourne `SearchFilters` |
| `search_listings` | Recherche catalogue | `filters: SearchFilters` | Appelle `searchListings()` |
| `get_listing_summary` | Résumé fiche | `slug: string` | Données publiques uniquement |
| `estimate_yield` | Rendement indicatif | `price, rent, charges` | Appelle `calculateInvestment()` |
| `convert_currency` | Conversion devise | `amount, from, to` | Taux `exchange_rates` |
| `list_neighborhoods` | Quartiers par ville | `city: string` | Référentiel `locations` |
| `explain_metric` | Définition métrique | `metric: string` | Texte statique (cap rate, cash-flow…) |

### Outils interdits

- Exécution SQL arbitraire
- Appels HTTP externes non listés
- Modification données (create/update/delete)
- Accès données utilisateur (email, favoris) sans auth

## Prompt système (esquisse)

```
Tu es l'assistant DarBladi pour l'immobilier au Maroc.
Règles :
- Ne jamais inventer d'annonces ; utiliser search_listings uniquement.
- Toujours mentionner si une hypothèse est faite (ville, budget, type).
- Refuser les demandes hors immobilier marocain.
- Citer sourceName et isDemo si donnée fictive.
- Ne pas stocker de données personnelles dans les réponses.
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `AI_PROVIDER` | `mock` | `mock` \| `openai` |
| `OPENAI_API_KEY` | — | Clé API (optionnelle MVP) |
| `AI_MAX_TOKENS` | `4096` | Limite tokens réponse |
| `AI_RATE_LIMIT_PER_MINUTE` | `20` | Rate limit par IP/session |

## Rate limiting et sécurité

- Limite requêtes par minute (env `AI_RATE_LIMIT_PER_MINUTE`)
- Pas de PII dans les logs LLM
- Sanitisation entrée utilisateur (longueur max 500 caractères)
- Timeout 10s sur appels provider
- Fallback automatique vers parseur local si LLM indisponible

## Schéma de validation

Les filtres LLM passent par `searchFiltersSchema` (Zod) :

```typescript
// modules/search/natural-language-parser.ts
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  transactionType: z.enum(["sale", "long_term_rent", "seasonal_rent"]).optional(),
  listingType: z.enum(["apartment", "villa", "riad", "land", "commercial", "office"]).optional(),
  city: z.string().optional(),
  // ... minPrice, maxPrice, hasPool, sort, pagination
});
```

Rejet silencieux des champs hors schéma.

## Évolutions Phase 3+

- Embeddings pgvector pour recherche sémantique
- RAG sur descriptions + pages quartiers
- Résumés fiches auto-générés (avec revue humaine)
- Comparaisons IA multi-biens
- Multilingue NLU (FR/AR/EN) via LLM

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/modules/search/natural-language-parser.ts` | Parseur mock |
| `src/app/[locale]/api/search/conversational/route.ts` | Endpoint API |
| `src/components/ai/conversational-search.tsx` | Interface utilisateur |
| `tests/search-parser.test.ts` | Tests parseur |

## Références

- Flux utilisateur : [`USER_FLOWS.md`](./USER_FLOWS.md) § Recherche IA
- Conformité données : [`DATA_SOURCES_AND_COMPLIANCE.md`](./DATA_SOURCES_AND_COMPLIANCE.md)
