# Reflection — AI-Assisted Development

## What I Learned Using AI Agents

Working on this FuelEU compliance platform with AI agents fundamentally changed how I approached the problem decomposition phase. The most valuable insight was that **AI agents are most effective when you give them precise domain specifications** — not vague requirements. When I provided the exact formula (`CB = (Target − Actual) × Energy in Scope`) and the precise constant (`89.3368 gCO₂e/MJ`), the generated code was immediately correct. When I provided vague prompts like "implement pooling logic", the output required significant correction.

The hexagonal architecture style amplified agent effectiveness. Because the domain layer has zero framework dependencies, I could generate it entirely in isolation and test it immediately. This created a virtuous loop: generate domain function → run unit test → verify → move to ports → generate adapter. The boundary between "what the agent generated" and "what I validated" was always clear.

---

## Efficiency Gains vs Manual Coding

| Task | Manual Estimate | With Agent | Savings |
|------|----------------|------------|---------|
| Domain types + interfaces | 1.5h | 15 min | ~85% |
| 4 Postgres repository adapters | 3h | 30 min | ~83% |
| Unit test scaffolding (20 tests) | 2h | 20 min | ~83% |
| Express router boilerplate | 1h | 10 min | ~83% |
| React tab components | 3h | 40 min | ~78% |
| CSS / Tailwind styling | 2h | 25 min | ~79% |
| **Total** | ~13.5h | **~2.5h** | **~81%** |

The largest gains were in adapter boilerplate — code that is structurally repetitive but error-prone to type manually (SQL parameter indices, row mapping). The agents produced this faster and with fewer typos than manual coding.

---

## Improvements I'd Make Next Time

**1. Prompt templating**
Before starting, I'd write a `prompts/` directory with reusable templates: one for "generate repository adapter for [Entity]", one for "generate HTTP controller for [UseCase]". Maintaining prompt consistency across a team reduces the quality variance between agent outputs.

**2. Contract tests before implementation**
I would generate contract tests (testing the port interface expectations) before generating adapters, not after. This would have caught the `setBaseline` bug earlier — the contract test would have specified "must clear previous baselines for same ship".

**3. Structured agent logs**
Logging every prompt-output pair with a timestamp and pass/fail indicator from tests would create an audit trail useful for debugging regressions. I tracked this manually in AGENT_WORKFLOW.md but could automate it.

**4. Use agents for integration test scaffolding**
I wrote integration tests manually. A well-prompted agent with the OpenAPI spec can generate Supertest integration tests that match the actual endpoint contracts — a significant time save I'll capture next time.

**5. Multi-agent pipeline**
For a larger codebase, a pipeline like: **Claude (architecture)** → **Copilot (implementation completions)** → **Claude Code (refactoring + linting)** would divide responsibilities more cleanly. Each agent has a different strength: Claude for design decisions, Copilot for in-IDE flow, Claude Code for batch refactoring across files.
