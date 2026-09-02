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
- [x] Set editor production env values in fe/apps/editor/.env.production.
- [x] Build editor artifact with yarn build:editor and verify dist/apps/editor outputs.
- [x] Provision S3 + CloudFront + OAC + TLS + DNS via Terraform (applied with default CloudFront domain).
- [x] Apply cache policy for federation files.
- [x] Point homepage production env to editor CDN remote URL.
- [x] Align backend origin/CORS policy as needed.
- [x] Add CI workflow for editor deploy (OIDC -> build -> s3 sync -> cloudfront invalidation).
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
- [x] File: fe/apps/editor/.env.production
- Required:
  - [x] VITE_API_ORIGIN set to backend ALB origin.
- Optional:
  - [x] VITE_HOMEPAGE_ORIGIN set to temporary editor CDN origin until homepage is deployed.
- [x] Validate editor does not rely on localhost fallback in production.

### 3) Build Artifact
- [x] Command:
  - cd fe
  - yarn build:editor
- [x] Verify output folder: dist/apps/editor
- [x] Verify required files exist:
  - [x] remoteEntry.js
  - [x] index.html
  - [x] hashed JS/CSS assets

### 4) Infrastructure Provisioning
- [x] Create/reuse Terraform module for static hosting with:
  - [x] S3 bucket for artifacts
  - [x] CloudFront distribution
  - [x] Origin Access Control (OAC)
  - [x] TLS enabled (CloudFront default certificate)
  - [x] DNS endpoint available (CloudFront default domain)
- [x] Apply Terraform in target AWS account to create resources.
- [x] Created outputs:
  - [x] S3 bucket: template-saas-prod-editor-site
  - [x] CloudFront distribution id: E3JAM41O329LKS
  - [x] CloudFront domain: dv3a184duo0ff.cloudfront.net
  - [x] Editor URL: https://dv3a184duo0ff.cloudfront.net

### 5) Cache Strategy
- [x] remoteEntry.js: low TTL or no-cache.
- [x] index.html: low TTL or no-cache.
- [x] Hashed chunks/assets: long TTL + immutable.
- [x] Applied CloudFront behaviors:
  - [x] remoteEntry.js -> min 0s, default 0s, max 60s
  - [x] index.html -> min 0s, default 0s, max 60s
  - [x] assets/* -> min 86400s, default 31536000s, max 31536000s

### 6) Homepage Runtime Config
- [x] File: homepage/.env.production
- [x] Set:
  - [x] NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD=https://dv3a184duo0ff.cloudfront.net

### 7) Backend Policy Alignment
- [x] Ensure backend allows required origin(s) for authenticated editor API calls.
- [x] Validate cookie and credentials behavior in production.
- [x] Applied backend runtime config:
  - [x] frontend_origin set to https://dv3a184duo0ff.cloudfront.net in be/infra/environments/prod/terraform.tfvars
  - [x] Targeted Terraform apply executed for module.ecs to roll new FRONTEND_ORIGIN into ECS task definition
  - [x] Credentials support confirmed in backend CORS config (credentials: true) and cookie parser wiring

### 8) CI/CD Workflow
- [x] Add workflow under fe/.github/workflows/.
- [x] Steps:
  - [x] Configure AWS credentials with OIDC
  - [x] Install dependencies
  - [x] Build editor
  - [x] Sync dist/apps/editor to S3
  - [x] Invalidate CloudFront for remoteEntry.js (and optionally index.html)
- [x] Workflow file: fe/.github/workflows/deploy-editor-prod.yml

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
| T2 | Configure editor production env | [x] | FE | 2026-09-02 | fe/apps/editor/.env.production created with API and temporary homepage origins |
| T3 | Build and verify editor artifact | [x] | FE | 2026-09-02 | nx build editor succeeded; remoteEntry.js, index.html, and hashed assets confirmed in dist/apps/editor |
| T4 | Provision S3 + CloudFront + OAC + TLS + DNS | [x] | Infra | 2026-09-04 | Applied successfully. Bucket template-saas-prod-editor-site, distribution E3JAM41O329LKS, domain dv3a184duo0ff.cloudfront.net |
| T5 | Apply cache policy for federation assets | [x] | Infra | 2026-09-04 | CloudFront ordered cache behaviors applied and validated for remoteEntry.js, index.html, and assets/* |
| T6 | Configure homepage remote URL env | [x] | FE | 2026-09-04 | homepage/.env.production updated with CloudFront editor remote URL |
| T7 | Align backend CORS/origin policy | [x] | BE | 2026-09-04 | FRONTEND_ORIGIN updated to CloudFront editor domain and rolled out via targeted ECS apply |
| T8 | Add CI workflow for editor deployment | [x] | FE + Infra | 2026-09-05 | Added fe/.github/workflows/deploy-editor-prod.yml with OIDC, build, S3 sync, and CloudFront invalidation |
| T9 | Add smoke tests and verify E2E | [ ] | FE + QA | 2026-09-05 | |
| T10 | Publish deployment runbook | [ ] | FE + Infra | 2026-09-05 | |

## Tracker Update Log
- 2026-09-01: Plan created.
- 2026-09-01: T1 completed. Homepage loader now resolves NEXT_PUBLIC_EDITOR_REMOTE_URL / NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD and normalizes final remoteEntry.js URL.
- 2026-09-01: T2 completed. Created fe/apps/editor/.env.production with VITE_API_ORIGIN and temporary VITE_HOMEPAGE_ORIGIN.
- 2026-09-01: T3 completed. Built editor artifact with nx build editor and verified dist/apps/editor contains remoteEntry.js, index.html, and hashed asset files.
- 2026-09-01: T4 completed. Applied module.editor_static_site and created S3 + CloudFront + OAC resources. Using CloudFront default domain (no custom Route53 alias yet).
- 2026-09-01: T5 completed. Applied CloudFront cache behaviors: remoteEntry.js/index.html low TTL and assets/* long immutable TTL.
- 2026-09-01: T6 completed. Updated homepage/.env.production with NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD=https://dv3a184duo0ff.cloudfront.net.
- 2026-09-02: T7 completed. Updated backend FRONTEND_ORIGIN to https://dv3a184duo0ff.cloudfront.net and applied ECS task definition update.
- 2026-09-02: T8 completed. Added fe/.github/workflows/deploy-editor-prod.yml for OIDC auth, editor build, S3 sync, and CloudFront invalidation.

## Deployment Readiness Checklist
- [x] Editor production env file reviewed.
- [x] Build output verified locally.
- [x] S3 bucket and CloudFront distribution created.
- [x] CloudFront cache behavior configured.
- [x] Homepage production env updated.
- [x] Backend origin/CORS rules confirmed.
- [ ] CI workflow passing.
- [ ] Smoke tests passing.
- [ ] Rollback steps documented.
