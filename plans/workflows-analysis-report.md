# GitHub Workflows Analysis Report

## Overview

This document analyzes all 12 workflow files in the `.github/workflows` folder of the Excalidraw project and provides recommendations for reconfiguring them for a fork at `abhijitsinghas/excalidraw`.

---

## Workflow Summary Table

| # | Workflow File | Purpose | Trigger | Requires Secrets |
| --- | --- | --- | --- | --- |
| 1 | [`test.yml`](.github/workflows/test.yml) | Run test suite | Push to `master` | No |
| 2 | [`lint.yml`](.github/workflows/lint.yml) | Lint and typecheck | Pull requests | No |
| 3 | [`deploy.yml`](.github/workflows/deploy.yml) | Build & deploy to GitHub Pages | Push to `master` or PR merge | No |
| 4 | [`cancel.yml`](.github/workflows/cancel.yml) | Cancel previous workflow runs | Push to `release` or any PR | No |
| 5 | [`size-limit.yml`](.github/workflows/size-limit.yml) | Check bundle size | PRs to `master` | No |
| 6 | [`test-coverage-pr.yml`](.github/workflows/test-coverage-pr.yml) | Generate test coverage reports | PRs | No |
| 7 | [`locales-coverage.yml`](.github/workflows/locales-coverage.yml) | Translation coverage reporting | Push to `l10n_master` | Yes (`PUSH_TRANSLATIONS_COVERAGE_PAT`) |
| 8 | [`publish-docker.yml`](.github/workflows/publish-docker.yml) | Build & push Docker image | Push to `release` | Yes (`DOCKER_USERNAME`, `DOCKER_PASSWORD`) |
| 9 | [`build-docker.yml`](.github/workflows/build-docker.yml) | Build Docker image | Push to `release` | No |
| 10 | [`autorelease-excalidraw.yml`](.github/workflows/autorelease-excalidraw.yml) | Auto-release to npm | Push to `release` | Yes (`NPM_TOKEN`) |
| 11 | [`semantic-pr-title.yml`](.github/workflows/semantic-pr-title.yml) | Enforce semantic PR titles | PR opened/edited/synced | No |
| 12 | [`sentry-production.yml`](.github/workflows/sentry-production.yml) | Sentry release tracking | Push to `release` | Yes (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) |

---

## Detailed Workflow Analysis

### 1. [`test.yml`](.github/workflows/test.yml)

**What it does:**

- Runs the main test suite (`yarn test:app`) on every push to the `master` branch
- Uses Node.js 20.x on Ubuntu latest

**Reconfiguration needed:**

- No changes required - works automatically for any fork

---

### 2. [`lint.yml`](.github/workflows/lint.yml)

**What it does:**

- Runs linting (`yarn test:code`), type checking (`yarn test:typecheck`), and other tests (`yarn test:other`) on every pull request
- Uses Node.js 20.x

**Reconfiguration needed:**

- No changes required - works automatically for any fork

---

### 3. [`deploy.yml`](.github/workflows/deploy.yml)

**What it does:**

- Builds the Excalidraw app and deploys it to GitHub Pages
- Triggers on:
  - Every push to `master`
  - When a PR targeting `master` is closed (merged)
- Uses Node.js 18 with yarn cache
- Deploys to the `gh-pages` branch

**Reconfiguration needed:**

- ✅ GitHub Pages will work automatically for your fork
- ⚠️ If you want a custom domain, you'll need to configure it in your fork's settings
- The deployment URL will change from `excalidraw.github.io/excalidraw` to `abhijitsinghas.github.io/excalidraw`

---

### 4. [`cancel.yml`](.github/workflows/cancel.yml)

**What it does:**

- Cancels previous in-progress workflow runs when a new commit is pushed
- Uses hardcoded workflow IDs (specific to excalidraw/excalidraw)
- Triggers on push to `release` branch or any PR

**Reconfiguration needed:**

- ⚠️ **Major changes needed**: The `workflow_id` field contains specific workflow IDs that are tied to the original repo. You need to find the workflow IDs for your fork or remove this workflow entirely
- To find new workflow IDs: Go to Actions tab → click on a workflow → URL contains the ID

---

### 5. [`size-limit.yml`](.github/workflows/size-limit.yml)

**What it does:**

- Checks the bundle size of `@excalidraw/excalidraw` package on PRs
- Uses `andresz1/size-limit-action` to track size changes
- Runs on PRs to `master` branch

**Reconfiguration needed:**

- No changes required - works automatically for any fork

---

### 6. [`test-coverage-pr.yml`](.github/workflows/test-coverage-pr.yml)

**What it does:**

- Generates test coverage reports for PRs
- Uses `davelosert/vitest-coverage-report-action` to post coverage comments
- Requires `pull-requests: write` permission

**Reconfiguration needed:**

- No changes required - works automatically for any fork

---

### 7. [`locales-coverage.yml`](.github/workflows/locales-coverage.yml)

**What it does:**

- Tracks translation coverage from Crowdin
- Triggers only on push to `l10n_master` branch (special branch for localization)
- Uses a personal access token (`PUSH_TRANSLATIONS_COVERAGE_PAT`) to commit changes
- Updates PR description with coverage stats

**Reconfiguration needed:**

- ⚠️ **Requires secrets**: `PUSH_TRANSLATIONS_COVERAGE_PAT` - This is a GitHub PAT with repo write access
- ⚠️ Only useful if you're using Crowdin for translations
- ⚠️ The branch `l10n_master` might not exist in your fork
- ⚠️ Email and name in git config are hardcoded (`bot@excalidraw.com`)

---

### 8. [`publish-docker.yml`](.github/workflows/publish-docker.yml)

**What it does:**

- Builds multi-platform Docker image (amd64, arm64, arm/v7)
- Pushes to DockerHub as `excalidraw/excalidraw:latest`
- Triggers on push to `release` branch

**Reconfiguration needed:**

- ⚠️ **Requires secrets**:
  - `DOCKER_USERNAME`
  - `DOCKER_PASSWORD`
- ⚠️ You need a DockerHub account
- ⚠️ Image tag is hardcoded as `excalidraw/excalidraw:latest` - consider changing to `abhijitsinghas/excalidraw:latest` or your own registry

---

### 9. [`build-docker.yml`](.github/workflows/build-docker.yml)

**What it does:**

- Simple Docker build (no push)
- Triggers on push to `release` branch
- Tags image as `excalidraw`

**Reconfiguration needed:**

- ⚠️ Consider updating the image tag to match your DockerHub username
- Otherwise works without secrets

---

### 10. [`autorelease-excalidraw.yml`](.github/workflows/autorelease-excalidraw.yml)

**What it does:**

- Automatically releases a new version to npm with `next` tag
- Triggers on push to `release` branch
- Uses semantic-release via `yarn release`

**Reconfiguration needed:**

- ⚠️ **Major changes needed**:
  - Requires `NPM_TOKEN` secret with npm publish access
  - Your npm package name would need to be different (likely `@abhijitsinghas/excalidraw` or similar)
  - The release configuration (`.releaserc.json`) may need updates for your package name
  - The `release` branch may not exist in your fork

---

### 11. [`semantic-pr-title.yml`](.github/workflows/semantic-pr-title.yml)

**What it does:**

- Enforces conventional commit PR titles using `amannn/action-semantic-pull-request`
- Runs on PR open, edit, and sync events

**Reconfiguration needed:**

- No changes required - works automatically for any fork

---

### 12. [`sentry-production.yml`](.github/workflows/sentry-production.yml)

**What it does:**

- Creates Sentry releases for production monitoring
- Builds the app and uploads source maps
- Triggers on push to `release` branch

**Reconfiguration needed:**

- ⚠️ **Requires secrets**:
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
- ⚠️ Requires a Sentry project setup
- ⚠️ The build output path `./build/static/js/` might need verification for your setup
- Consider disabling or removing if not using Sentry

---

## Summary: Reconfiguration Changes Needed

### ✅ Works Automatically (No Changes)

1. `test.yml` - Test suite
2. `lint.yml` - Linting
3. `size-limit.yml` - Bundle size
4. `test-coverage-pr.yml` - Coverage reports
5. `semantic-pr-title.yml` - PR title enforcement

### ⚠️ Needs Minor Changes

1. `deploy.yml` - GitHub Pages URL will change automatically
2. `build-docker.yml` - Optional: update image tag

### ⚠️ Needs Major Changes or Secrets

1. `cancel.yml` - Update workflow IDs or remove
2. `locales-coverage.yml` - Needs PAT, branch, may not apply
3. `publish-docker.yml` - Needs DockerHub credentials
4. `autorelease-excalidraw.yml` - Needs npm token and package config
5. `sentry-production.yml` - Needs Sentry credentials and project

### 🔴 Consider Removing

- `locales-coverage.yml` - Only if using Crowdin translations
- `sentry-production.yml` - Only if using Sentry
- `cancel.yml` - Only if you need it

---

## Branch Reference Changes

The workflows reference these branches:

- `master` - Main development branch
- `release` - Release/production branch
- `l10n_master` - Localization branch

If your fork uses different branch names (e.g., `main` instead of `master`), you'll need to update the branch references in:

- `test.yml`
- `deploy.yml`
- `size-limit.yml`
- `cancel.yml`
- `locales-coverage.yml`
- `publish-docker.yml`
- `build-docker.yml`
- `autorelease-excalidraw.yml`
- `sentry-production.yml`

---

## Recommendations for Your Fork

1. **Keep core CI workflows**: test, lint, size-limit, semantic-pr-title, test-coverage-pr
2. **Keep deploy.yml** but expect different GitHub Pages URL
3. **Remove or disable**: release-related workflows (autorelease, docker publish, sentry) unless you plan to:
   - Publish your own npm package
   - Push to your own DockerHub
   - Use Sentry for error tracking
4. **Update branch names** if using `main` instead of `master`
5. **Remove cancel.yml** or update with your fork's workflow IDs

---

_Generated on: 2026-02-15_
