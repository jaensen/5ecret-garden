# Development, CI/CD, GitHub and versioning workflow

**Scope:** `5ecret-garden` monorepo, `circles-app`, and `packages/*`.

This document turns the project architecture rules into a practical day-to-day workflow. It is written outside-in on purpose: repository → branch → change → checks → pull request → release.

---

## 1. Golden rule: work outside-in

Before changing code, identify the layer you are touching:

1. **Route/page layer:** `circles-app/src/routes/*`
2. **Feature/domain layer:** `circles-app/src/lib/areas/*`
3. **Shared foundation:** `circles-app/src/lib/shared/*`
4. **Library/package layer:** `packages/*`

Use the smallest correct layer. Do not move app-specific state into `packages/*` unless the package contract is explicitly designed for it.

---

## 2. Branching model

Recommended lightweight GitHub flow:

- `main`: protected, releasable state.
- `dev`: integration branch if the team wants a staging lane.
- feature branches: `feat/<short-topic>`
- bugfix branches: `fix/<short-topic>`
- docs branches: `docs/<short-topic>`
- maintenance branches: `chore/<short-topic>`

Examples:

```bash
git checkout dev
git pull --ff-only
git checkout -b feat/send-flow-validation-copy
```

Keep branches small. Prefer several focused PRs over one broad PR.

---

## 3. Commit style

Use Conventional Commit-style messages. This keeps history searchable and makes future automated changelog/version tooling easier.

Common prefixes:

- `feat:` user-facing feature
- `fix:` bug fix
- `docs:` documentation only
- `test:` tests only
- `refactor:` behavior-preserving code change
- `chore:` tooling, dependencies, maintenance
- `ci:` GitHub Actions or deployment pipeline

Examples:

```bash
git commit -m "feat(wallet): improve send amount validation"
git commit -m "fix(popup): preserve input editing on backspace"
git commit -m "ci: add app and package checks"
```

---

## 4. Pull request checklist

Every PR should answer:

- What changed?
- Which layer changed? (`routes`, `areas`, `shared`, `packages`)
- Which user flow is affected?
- Which checks/tests were run?
- Are screenshots or short screen recordings needed?

For frontend/UI changes, include:

- mobile and desktop notes,
- keyboard behavior notes,
- popup/focus behavior notes if relevant,
- before/after screenshots if visual layout changed.

For Web3/wallet changes, explicitly mention:

- signer/provider impact,
- chain/network impact,
- transaction failure handling,
- user rejection handling.

---

## 5. Local checks before pushing

From repo root:

```bash
npm ci
```

For the app:

```bash
cd circles-app
npm run check
npm exec -- vitest run
npm run build
```

Optional guardrails, if the scripts exist:

```bash
test -f scripts/flow-contract-guardrails.mjs && npm run check:flow-contracts
test -f scripts/ui-token-guardrails.mjs && npm run check:ui-tokens
test -f scripts/ui-token-guardrails.mjs && npm run check:ui-tokens:strict
```

Current repository note: `circles-app/package.json` references `scripts/flow-contract-guardrails.mjs` and `scripts/ui-token-guardrails.mjs`, but this checkout currently has no files in `circles-app/scripts/`. Treat this as a repository inconsistency until those scripts are restored or package scripts are updated.

For packages:

```bash
npm run typecheck --workspace @circles-market/core
npm run build --workspace @circles-market/core
```

Or run package checks through CI.

---

## 6. GitHub Actions CI

The repository uses GitHub Actions workflows under `.github/workflows/`:

- `ci.yml`
  - installs workspace dependencies with `npm ci`,
  - runs `circles-app` typecheck,
  - runs Vitest,
  - builds the SvelteKit app,
  - runs package typecheck/build scripts where available,
  - runs app guardrails only when their files exist.
- `package-publish-dry-run.yml`
  - validates package publishability on PRs touching packages/publish tooling,
  - builds publishable packages,
  - runs `npm publish --dry-run`,
  - does not publish anything.

Best practice: require `CI / circles-app checks` and `CI / workspace package checks` as branch protection checks before merging to `main`.

---

## 7. Versioning model

Use Semantic Versioning for publishable packages under `packages/*`:

- `PATCH` for backwards-compatible fixes: `0.1.0` → `0.1.1`
- `MINOR` for backwards-compatible features: `0.1.0` → `0.2.0`
- `MAJOR` for breaking changes: `1.2.3` → `2.0.0`

Because several packages depend on each other, update dependent package ranges deliberately. Example: `@circles-market/sdk` depends on the other market packages.

Do not publish an already existing version. `publish-packages.sh` already checks the npm registry and refuses duplicate versions.

---

## 8. Package release process

Use dry-run first:

```bash
./publish-packages.sh --dry-run
```

Publish only after CI is green and versions are reviewed:

```bash
./publish-packages.sh --publish --tag latest
```

If npm 2FA requires OTP:

```bash
./publish-packages.sh --publish --tag latest --otp <otp>
```

Recommended release checklist:

- versions bumped intentionally,
- changelog/release notes prepared,
- CI green on the release branch,
- dry-run successful,
- npm authentication verified,
- GitHub release or tag created after publish.

Suggested tag format:

```txt
packages-YYYY-MM-DD
@circles-market/core@0.1.1
```

Use package-specific tags when releasing only one package.

---

## 9. Deployment model for `circles-app`

The app has build scripts:

```bash
npm run build
npm run build:digitalocean
```

The current README mentions a DigitalOcean deployment URL, but deployment secrets, environments, and production deployment workflow are **UNVERIFIED** in this checkout.

Until deployment is documented, recommended GitHub environments are:

- `staging` from `dev`
- `production` from `main`

Keep deploy workflows separate from CI and require manual approval for production.

---

## 10. Frontend-specific best practices

When changing UI:

- Start from existing docs and primitives.
- Use `src/lib/areas/*` for feature-specific code.
- Use `src/lib/shared/*` only for genuinely reusable foundations.
- Do not duplicate popup, tabs, list, focus, or flow primitives.
- Use the Send flow as the reference for multi-step popup UX.
- Keep keyboard behavior and focus behavior intentional.

Important references:

- `AGENTS.md`
- `.clinerules/project.md`
- `docs/ui-architecture-guardrails.md`

---

## 11. Safe change order for ADHD-friendly work

Use this checklist for every task:

1. Read the task once.
2. Write down the affected layer.
3. Open the route/page entry point.
4. Open the domain folder.
5. Search for existing shared primitive.
6. Make the smallest change.
7. Add/update tests if behavior changed.
8. Run checks.
9. Review diff.
10. Commit with a clear Conventional Commit message.
11. Open PR with screenshots/test notes if relevant.

This keeps work small, reviewable, and recoverable.
