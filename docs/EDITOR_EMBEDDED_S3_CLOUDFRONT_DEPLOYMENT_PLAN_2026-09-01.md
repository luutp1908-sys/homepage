# Embedded Editor Deployment Plan (S3 + CloudFront)

Date: 2026-09-01
Status: Planned
Owner: FE + Infra

## Goal
Deploy fe/apps/editor as a Module Federation remote hosted on S3 + CloudFront, and load it inside homepage as a normal embedded React component.

## Architecture Decision
- Homepage is the only user entrypoint.
- Editor is not a standalone user-facing app route.
- S3 + CloudFront serve editor static assets only (including remoteEntry.js and hashed chunks).

## Plan
- [x] Freeze integration contract: homepage mounts editor remote component and reads production remote URL from env.
- [ ] Set editor production env values in fe/apps/editor/.env.production.
- [ ] Build editor artifact with yarn build:editor and verify dist/apps/editor outputs.
- [ ] Provision S3 + CloudFront + OAC + TLS + DNS via Terraform.
- [ ] Apply cache policy for federation files.
- [ ] Point homepage production env to editor CDN remote URL.
- [ ] Align backend origin/CORS policy as needed.
- [ ] Add CI workflow for editor deploy (OIDC -> build -> s3 sync -> cloudfront invalidation).
- [ ] Add post-deploy smoke checks.
- [ ] Publish and maintain deployment runbook.

## Detailed Tasks
### 1) Integration Contract
- [x] Confirm homepage uses NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD for remote loading.
- [x] Confirm final remote URL format expected by homepage loader.
- [x] Contract details:
  - [x] Env precedence is NEXT_PUBLIC_EDITOR_REMOTE_URL -> NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD -> NEXT_PUBLIC_EDITOR_REMOTE_URL_LOCAL -> http://localhost:5174.
  - [x] Supported values: base URL (for example https://cdn.example.com/editor) or full remote entry URL (for example https://cdn.example.com/editor/remoteEntry.js).
  - [x] Loader normalizes to a final remote entry URL ending with /remoteEntry.js.

### 2) Editor Env Setup
- [ ] File: fe/apps/editor/.env.production
- Required:
  - [ ] VITE_API_ORIGIN=https://your-api-domain
- Optional:
  - [ ] VITE_HOMEPAGE_ORIGIN=https://your-homepage-domain
- [ ] Validate editor does not rely on localhost fallback in production.

### 3) Build Artifact
- [ ] Command:
  - cd fe
  - yarn build:editor
- [ ] Verify output folder: dist/apps/editor
- [ ] Verify required files exist:
  - [ ] remoteEntry.js
  - [ ] index.html
  - [ ] hashed JS/CSS assets

### 4) Infrastructure Provisioning
- [ ] Create/reuse Terraform module for static hosting with:
  - S3 bucket for artifacts
  - CloudFront distribution
  - Origin Access Control (OAC)
  - ACM certificate
  - Route53 alias record

### 5) Cache Strategy
- [ ] remoteEntry.js: low TTL or no-cache.
- [ ] index.html: low TTL or no-cache.
- [ ] Hashed chunks/assets: long TTL + immutable.

### 6) Homepage Runtime Config
- [ ] File: homepage/.env.production
- [ ] Set:
  - [ ] NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD=<cloudfront-editor-remote-url>

### 7) Backend Policy Alignment
- [ ] Ensure backend allows required origin(s) for authenticated editor API calls.
- [ ] Validate cookie and credentials behavior in production.

### 8) CI/CD Workflow
- [ ] Add workflow under fe/.github/workflows/.
- [ ] Steps:
  - [ ] Configure AWS credentials with OIDC
  - [ ] Install dependencies
  - [ ] Build editor
  - [ ] Sync dist/apps/editor to S3
  - [ ] Invalidate CloudFront for remoteEntry.js (and optionally index.html)

### 9) Smoke Tests
- [ ] Verify remoteEntry.js returns HTTP 200.
- [ ] Verify homepage renders embedded editor without runtime remote load errors.
- [ ] Verify editor API operations: load template, save draft, export.

### 10) Runbook
- [ ] Document deploy command path, rollback path, cache policy, and env requirements.

## Tracker
Legend:
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked

| ID | Task | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|
| T1 | Freeze integration contract | [x] | FE | 2026-09-02 | Loader contract implemented in EmbeddedEditorHost.tsx |
| T2 | Configure editor production env | [ ] | FE | 2026-09-02 | |
| T3 | Build and verify editor artifact | [ ] | FE | 2026-09-02 | |
| T4 | Provision S3 + CloudFront + OAC + TLS + DNS | [ ] | Infra | 2026-09-04 | |
| T5 | Apply cache policy for federation assets | [ ] | Infra | 2026-09-04 | |
| T6 | Configure homepage remote URL env | [ ] | FE | 2026-09-04 | |
| T7 | Align backend CORS/origin policy | [ ] | BE | 2026-09-04 | |
| T8 | Add CI workflow for editor deployment | [ ] | FE + Infra | 2026-09-05 | |
| T9 | Add smoke tests and verify E2E | [ ] | FE + QA | 2026-09-05 | |
| T10 | Publish deployment runbook | [ ] | FE + Infra | 2026-09-05 | |

## Tracker Update Log
- 2026-09-01: Plan created.
- 2026-09-01: T1 completed. Homepage loader now resolves NEXT_PUBLIC_EDITOR_REMOTE_URL / NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD and normalizes final remoteEntry.js URL.

## Deployment Readiness Checklist
- [ ] Editor production env file reviewed.
- [ ] Build output verified locally.
- [ ] S3 bucket and CloudFront distribution created.
- [ ] CloudFront cache behavior configured.
- [ ] Homepage production env updated.
- [ ] Backend origin/CORS rules confirmed.
- [ ] CI workflow passing.
- [ ] Smoke tests passing.
- [ ] Rollback steps documented.
