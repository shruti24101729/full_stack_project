# AI Agent Workflow Log

## Agents Used

| Agent | Role | Where Used |
|-------|------|-----------|
| **Claude (claude.ai)** | Primary architect, full-stack scaffolding, domain modeling | Entire project generation |
| **GitHub Copilot** | Inline completions during manual refinements | IDE — repetitive patterns (mapRow, test assertions) |
| **Cursor Agent** | Refactoring pass on repository adapters | Outbound postgres adapters |

---

## Overview

The project was built in a structured agent-assisted workflow:

1. **Architecture planning** — Claude generated the hexagonal folder structure and interfaces (`IRouteRepository`, `IComplianceRepository`, etc.) before any implementation code.
2. **Domain-first** — Domain entities and pure functions (CB formula, pooling rules) were generated first with no framework dependencies, making them trivially testable.
3. **Ports → Adapters** — Interfaces were defined before implementations, ensuring the core is never coupled to Express or pg.
4. **Test-driven validation** — Unit tests for domain logic were generated alongside the domain code and run to verify correctness.

---

## Architecture Summary (Hexagonal)

```
┌─────────────────────────────────────────────────────┐
│                      CORE                           │
│  domain/  ← pure functions, no imports             │
│  application/ ← use-cases, depend only on ports    │
│  ports/ ← interfaces (contracts)                   │
└───────────────┬──────────────────┬─────────────────┘
                │ inbound           │ outbound
   ┌────────────▼──────────┐  ┌────▼──────────────────┐
   │ HTTP Controllers      │  │ Postgres Repositories  │
   │ (Express adapters)    │  │ (pg adapter)           │
   └───────────────────────┘  └───────────────────────┘
```

**Rule enforced**: `core/` never imports from `adapters/` or `infrastructure/`. Dependency direction always points inward.

---

## Prompts & Outputs

### Example 1 — Domain entity generation

**Prompt used:**
```
Generate a TypeScript interface and pure function for FuelEU Compliance Balance.
Formula: CB = (Target - Actual) × Energy in Scope
Target = 89.3368 gCO2e/MJ, Energy = fuelConsumption * 41000 MJ/t
Return surplus/deficit status. No framework dependencies.
```

**Output (excerpt):**
```typescript
export function computeComplianceBalance(
  shipId: string, year: number,
  actualGhgIntensity: number, fuelConsumptionTonnes: number
): Omit<ComplianceBalance, 'id' | 'createdAt'> {
  const energyInScope = fuelConsumptionTonnes * ENERGY_FACTOR_MJ_PER_TONNE;
  const cbGco2eq = (TARGET_GHG_INTENSITY_2025 - actualGhgIntensity) * energyInScope;
  return {
    shipId, year, cbGco2eq,
    actualIntensity: actualGhgIntensity,
    targetIntensity: TARGET_GHG_INTENSITY_2025,
    energyInScope,
    status: cbGco2eq >= 0 ? 'surplus' : 'deficit',
  };
}
```

**Validation**: Unit test confirmed formula matches spec values for R001 (91.0 ghg, 5000t → deficit) and R002 (88.0, 4800t → surplus). ✅

---

### Example 2 — Pooling allocation refinement

**Initial prompt:**
```
Implement FuelEU Article 21 pooling allocation. Sort members desc by CB.
Transfer surplus to deficits greedily. Enforce: sum >= 0, surplus ship
cannot exit negative, deficit ship cannot exit worse.
```

**Agent output had a bug**: The original output used `Math.min(deficit, available)` but didn't account for the rule "surplus cannot exit negative", occasionally going below zero when deficits were large.

**Refinement prompt:**
```
The transfer amount should be: actualTransfer = Math.min(deficit, working[i].cbAfter)
to prevent surplus ship going negative. Add post-validation check too.
```

**Corrected output:**
```typescript
const actualTransfer = Math.min(transfer, working[i].cbAfter);
working[i].cbAfter -= actualTransfer;
working[j].cbAfter += actualTransfer;
```

**Validation**: Test `surplus ship does not go negative` now passes. ✅

---

## Validation / Corrections

| Area | Issue | Fix |
|------|-------|-----|
| Pooling transfer logic | Surplus ship could go negative | Added `Math.min(transfer, working[i].cbAfter)` clamp |
| `setBaseline` | Initially didn't clear previous baselines for same ship | Added `UPDATE SET is_baseline=FALSE WHERE ship_id = $1` before setting new baseline |
| `getAdjustedCb` | Didn't auto-compute CB if no record existed | Added fallback: call `computeAndStore` when record not found |
| Frontend `CompareTab` | Chart x-axis labels overlapping | Added `angle={-35}` and `textAnchor="end"` |

All agent outputs were:
1. Read and understood before committing
2. Tested with unit tests
3. Manually checked against the regulation spec PDF

---

## Observations

### Where the agent saved time
- **Boilerplate elimination**: Scaffolding 5 repository adapters with consistent mapRow patterns — ~45 minutes saved
- **TypeScript type inference**: Generating strict types for all domain interfaces without drift between layers
- **Test case coverage**: First-pass unit tests covered 90% of edge cases (negative CB, over-apply bank, invalid pool sum)
- **SQL generation**: INSERT...ON CONFLICT upsert patterns for compliance snapshots

### Where it failed or hallucinated
- **Over-eager validation**: First pass of `applyBanked` threw on zero-amount instead of checking positivity properly
- **Pooling edge case**: Missing the "surplus cannot exit negative" guard (fixed via refinement)
- **mapRow type safety**: Initially used `any` for row types; manually tightened to `Record<string, unknown>` with explicit casts

### How tools were combined
- **Claude**: Architecture + domain logic + controllers — anything requiring design decisions
- **Copilot**: Autocomplete for repetitive SQL parameter lists, `toFixed`/`toLocaleString` formatting chains
- **Cursor Agent**: One-shot refactor of all `mapRow` functions to add `dominant-baseline` casts when switching from `any` to `Record<string, unknown>`

---

## Best Practices Followed

- **Domain-first generation**: Generated pure domain types and functions before any framework code
- **Interface-before-implementation**: All ports (interfaces) were generated before their adapters, enforcing clean dependency direction
- **Incremental commits**: Each layer (domain → ports → adapters → controllers) committed separately
- **Prompt specificity**: Included exact formulas, column names, and validation rules from the spec in prompts to reduce hallucination
- **Test every output**: Every agent-generated function was unit tested before being wired up to HTTP
- **No blind trust**: Pooling logic was manually traced against Article 21 edge cases before accepting the output
