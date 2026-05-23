# Cline Workspace Rules — circles-app

Keep this file lean. It is only the workspace entrypoint, not the full policy manual.

## 1. Source of truth order

Before making claims or changes, use these docs as the authoritative sources:

1. `AGENTS.md`
2. `docs/ui-architecture-guardrails.md`
3. `docs/development-workflow.md`

Use older docs only when needed for historical context, not as the current source of truth.

## 2. Evidence-first rule

- Do not invent project facts.
- Back architecture or workflow claims with file paths.
- Mark unknown or missing information as `UNVERIFIED`.
- If repository files contradict each other, report the inconsistency instead of guessing.

## 3. UI architecture rule

For UI work, follow `docs/ui-architecture-guardrails.md`.

In particular:

- solve generic interaction problems in shared package primitives,
- solve app-wide product integration in app wrappers,
- solve domain-specific composition in feature code,
- preserve keyboard, focus, popup, list, tab, row, and flow-step contracts.
- for major UI experiments on proven components, prefer a parallel experimental component first and ask before modifying the trusted component directly.

Do not restate those rules here; the guardrail doc is the source of truth.

## 4. Workflow rule

For branching, commits, checks, CI, release, and publishing, follow `docs/development-workflow.md`.

Do not duplicate workflow policy here unless a rule is truly workspace-specific and missing from that document.

## 5. Web3 / wallet caution

Do not introduce a second wallet, signer, SDK, or chain integration pattern without first inspecting the current implementation under:

- `src/config.ts`
- `src/lib/shared/state/`
- `src/lib/shared/integrations/`

If the current architecture is unclear, inspect first and mark gaps as `UNVERIFIED`.

## 6. Repository inconsistency rule

If a documented or package-script-based guardrail references missing files, report that explicitly as a repository inconsistency.

Current known example:

- `circles-app/package.json` references guardrail scripts under `circles-app/scripts/`, while this checkout may not contain those files.
