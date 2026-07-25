# DarBladi — Calculs d'investissement

> Implémentation : [`src/modules/investment/calculations.ts`](../src/modules/investment/calculations.ts)  
> Tests : [`tests/investment.test.ts`](../tests/investment.test.ts)  
> UI : [`src/components/investment/investment-simulator.tsx`](../src/components/investment/investment-simulator.tsx)

## Vue d'ensemble

Le simulateur calcule la rentabilité d'un investissement immobilier au Maroc : coût d'acquisition total, financement, revenus locatifs nets, rendements et cash-flow mensuel.

## Entrées (`InvestmentInputs`)

| Paramètre | Type | Description | Unité |
|-----------|------|-------------|-------|
| `purchasePrice` | number | Prix d'achat | MAD |
| `acquisitionFeesRate` | number | Frais notaire + enregistrement | % du prix |
| `renovationCost` | number | Travaux | MAD |
| `furnishingCost` | number | Ameublement | MAD |
| `downPaymentRate` | number | Apport personnel | % coût total |
| `loanRate` | number | Taux crédit annuel | % |
| `loanYears` | number | Durée emprunt | années |
| `annualRent` | number | Loyer annuel brut | MAD/an |
| `vacancyRate` | number | Vacance locative | % loyer brut |
| `chargesRate` | number | Charges locatives non récup. | % loyer brut |
| `maintenanceRate` | number | Entretien | % prix achat / an |
| `managementRate` | number | Gestion locative | % loyer brut |
| `insuranceAnnual` | number | Assurance PNO | MAD/an |
| `taxRate` | number | Imposition revenus fonciers | % loyer brut |
| `nightlyRate` | number? | Tarif nuit (saisonnier) | MAD/nuit |
| `occupancyRate` | number? | Taux occupation | % |
| `isSeasonal` | boolean? | Location saisonnière | — |

## Formules

### 1. Coût d'acquisition total

```
acquisitionFees = purchasePrice × (acquisitionFeesRate / 100)
totalAcquisitionCost = purchasePrice + acquisitionFees + renovationCost + furnishingCost
```

### 2. Financement

```
downPayment = totalAcquisitionCost × (downPaymentRate / 100)
loanAmount = totalAcquisitionCost - downPayment
```

### 3. Mensualité crédit (amortissement constant)

Formule standard :

```
Si loanAmount ≤ 0 → monthlyPayment = 0
Si loanRate ≤ 0   → monthlyPayment = loanAmount / (loanYears × 12)

monthlyRate = (loanRate / 100) / 12
n = loanYears × 12

monthlyPayment = loanAmount × monthlyRate × (1 + monthlyRate)^n
                 ─────────────────────────────────────────────
                         (1 + monthlyRate)^n - 1
```

```
totalCreditCost = monthlyPayment × loanYears × 12
```

### 4. Revenu locatif annuel

**Location classique :**
```
annualRent = inputs.annualRent
```

**Location saisonnière :**
```
annualRent = nightlyRate × (occupancyRate / 100) × 365
```

### 5. Charges et revenu net

```
vacancy     = annualRent × (vacancyRate / 100)
charges     = annualRent × (chargesRate / 100)
maintenance = purchasePrice × (maintenanceRate / 100)
management  = annualRent × (managementRate / 100)
tax         = annualRent × (taxRate / 100)

netAnnualIncome = annualRent - vacancy - charges - maintenance - management - insuranceAnnual - tax
```

### 6. Indicateurs de performance

```
grossYield = (annualRent / totalAcquisitionCost) × 100

netYield = (netAnnualIncome / totalAcquisitionCost) × 100

monthlyCashFlow = (netAnnualIncome / 12) - monthlyPayment

capRate = (netAnnualIncome / purchasePrice) × 100

pricePerSqm = purchasePrice / livingArea   (si livingArea fourni)
```

## Scénarios (prudent / central / optimiste)

La fonction `applyScenarioMultiplier()` ajuste les hypothèses :

| Scénario | Loyer (`rent`) | Vacance (`vacancy`) | Occupation (`occupancy`) |
|----------|----------------|---------------------|--------------------------|
| Prudent | × 0,85 | × 1,30 | × 0,85 |
| Central | × 1,00 | × 1,00 | × 1,00 |
| Optimiste | × 1,15 | × 0,70 | × 1,10 |

La vacance est plafonnée à 100 %.

## Exemple chiffré

**Entrées :**
- Prix : 1 000 000 MAD
- Frais acquisition : 6 %
- Apport : 30 %, crédit 4,5 % sur 20 ans
- Loyer : 60 000 MAD/an
- Vacance 8 %, charges 5 %, entretien 1 %, gestion 8 %, assurance 2 000 MAD, taxe 0 %

**Résultats attendus :**
- `totalAcquisitionCost` = 1 060 000 MAD
- `grossYield` ≈ 5,66 %
- `netYield` < `grossYield`
- `monthlyCashFlow` = revenu net mensuel − mensualité crédit

(Voir tests Vitest pour plages de validation.)

## Limites et disclaimers

- **Indicatif uniquement** : ne remplace pas un conseil fiscal, juridique ou bancaire
- Taux de change affichés séparément (module `convertPrice`)
- Taxe foncière marocaine simplifiée via `taxRate` unique
- Pas de plus-value, inflation, ou révision loyer modélisées en MVP
- Crédit : hypothèse mensualité constante (pas d'assurance emprunteur)

## Affichage UI

Le simulateur présente :
- Coût total et apport
- Mensualité et coût total crédit
- Rendement brut / net (%)
- Cash-flow mensuel (positif = vert, négatif = alerte)
- Cap rate
- Prix au m² (si surface connue)

## Extension future

- Amortissement fiscal IR / IS
- Simulation SCI / détention via société
- Stress test taux (+1 %, +2 %)
- Import automatique depuis fiche bien (`estimatedYield`)
