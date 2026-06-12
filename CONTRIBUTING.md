# Contributing to itsjust

Thanks for your interest in contributing! This document covers the basics.

## Development Setup

### Prerequisites

- **Node.js >= 22.0.0** (check with `node --version`)
- **pnpm >= 9.0.0** or **yarn >= 1.22.0** (optional, but recommended for workspace speed)
- A modern browser (Chrome, Firefox, Edge, or Safari)

### Quick Start

```bash
git clone https://github.com/ItsJust-tools/contrast-checker.git
cd contrast-checker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the tool.

### Editor Config (Recommended)

This tool uses an `.editorconfig` to enforce consistent formatting across editors. To activate it:

1. Install an EditorConfig plugin for your editor:
   - VS Code: [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
   - JetBrains (WebStorm/IntelliJ): Built-in support
   - Vim/Neovim: [editorconfig-vim](https://github.com/editorconfig/editorconfig-vim)
2. The `.editorconfig` file is generated from the template at build time and sourced in `.gitignore`. Create your own at the repo root:

```ini
# .editorconfig (create manually if needed)
root = true

[*]
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{ts,tsx,js,jsx}]
indent_style = space
indent_size = 2

[*.{json,yml,yaml,md}]
indent_style = space
indent_size = 2
```

Formatting is also automatically enforced via Prettier (run `npm run format` to reformat all files).

## Branching Strategy

- `main` — production-ready code
- Feature branches: `feat/short-description`
- Bugfix branches: `fix/short-description`

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `test:` — adding or updating tests
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `chore:` — build process or auxiliary tool changes

Example:

```text
feat: add svg export support

- register svg exporter in tool-definition.ts
- add svg format to ExportFormat union
```

## Testing

All changes must include tests. We use Vitest for unit tests and Playwright for E2E.

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

### Coverage Requirements

- `packages/core/src`: minimum 85% coverage (lines, functions, branches, statements)
- `src/`: minimum 70% coverage

Run `npm test -- --coverage` to see the per-package breakdown.

### Snapshot Stability

Visual regression tests use Playwright screenshots. To keep snapshots stable:

- Run snapshots in the **same OS and browser** as CI (Ubuntu + Chromium)
- Avoid animations in test paths or wait for them to finish
- Use deterministic data (fixed dates, seeded randomness)
- Update baselines with `npm run test:e2e -- --update-snapshots` only when UI intentionally changes

### Writing Tests

- Mock external APIs (localStorage, navigator.share, URL.createObjectURL).
- Test error paths, not just happy paths.
- Use `@testing-library/react` for component tests.
- Wrap components that use `useToast` in `<ToastProvider>`.
- Mock `console.error`/`console.warn` in tests that trigger expected errors to keep stderr clean.

## Code Style

- No `eslint-disable` for `react-hooks/exhaustive-deps` without a detailed comment explaining why.
- Prefer `useCallback` over inline functions passed as props.
- Keep components focused — one component, one responsibility.
- Add `displayName` to all exported components.

## AI-Assisted Contributions

- AI-generated changes must follow project philosophy strictly:
  - single-purpose UX (no feature bloat),
  - privacy-first/client-only defaults,
  - accessibility as a hard requirement.
- AI-generated changes must not silently mutate template baseline data/contracts to hide upstream template defects.
- If an AI suggestion conflicts with these principles, contributors must reject or revise it before merge.
- If an issue is template-level, call it out explicitly and track it as a template update requirement.
- AI-assisted PRs must include:
  - tests for behavioral changes,
  - documentation updates for user-visible changes,
  - `CHANGELOG.md` updates under `[Unreleased]`.

## Pull Request Process

### Before You Commit

Run these checks locally to catch issues early:

```bash
# Lint your changes
npm run lint

# Run unit tests
npm test

# Check formatting
npm run format:check
```

If you add new dependencies, run `npm run deps:check` to flag unused packages.

### Creating a PR

1. Create a feature branch from `main`.
2. Make your changes with tests.
3. Ensure `npm run build` and `npm test` pass.
4. Update `CHANGELOG.md` under `[Unreleased]`.
5. Create a pull request targeting `main`. Include a clear description of the change and motivation.
6. If your change is user-visible, include a screenshot or video preview.

## Reporting Issues

Use GitHub Issues. Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Screenshots if applicable
