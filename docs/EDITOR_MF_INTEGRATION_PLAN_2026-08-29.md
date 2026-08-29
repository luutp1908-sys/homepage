# Editor Module Federation Integration Plan

Date: 2026-08-29
Owner: Homepage + FE Editor integration
Status: In progress

## Goal

Load fe/apps/editor inside homepage main content using module federation, with no new window and no full page reload.

Constraints:

- Keep homepage left sidebar and top header visible when editor is open.
- Keep editor URL semantics (templateId/workspaceId/adminEdit query and draft path behavior).
- Homepage auth/session is the single source of truth.
- Hide editor header in embedded mode.
- Disable editor login modal in embedded mode.
- Keep fe/apps/editor working as a standalone app.

## Progress Checklist

### Phase 1: Route + Navigation

- [x] Add dedicated embedded editor route at /editor under public area.
- [x] Ensure /editor renders inside existing homepage shell (sidebar + header).
- [x] Change template list cards to navigate internally to /editor (no target _blank).
- [x] Preserve query params: templateId, workspaceId, adminEdit.

### Phase 2: Federation Infrastructure

- [x] Configure fe/apps/editor as federated remote and expose embedded entry.
- [x] Configure homepage as federated host and register editor remote.
- [x] Implement remote loader with suspense + error fallback in homepage.
- [x] Add environment mapping for remote URL (local/prod placeholder).

### Phase 3: Embedded Mode Contract

- [x] Add embedded contract (isEmbedded, auth bridge, callbacks) in editor exposed entry.
- [x] Refactor editor app composition for standalone vs embedded mode.
- [x] Hide editor top header in embedded mode.
- [x] Disable editor login modal in embedded mode.
- [x] Keep standalone mode behavior unchanged.

### Phase 4: Auth Source of Truth

- [x] Wire homepage auth state into embedded editor.
- [x] In embedded mode, bypass editor-owned auth bootstrap/refresh ownership.
- [x] Delegate login prompts to homepage modal only.
- [ ] Verify logout/login state changes reflect immediately in embedded editor.

### Phase 5: Verification + Rollback

- [ ] Verify template click performs client-side transition to /editor.
- [ ] Verify shell persistence while editor is mounted.
- [ ] Verify template fetch behavior from URL still matches current behavior.
- [ ] Verify remote load failure fallback UX.
- [ ] Add feature flag fallback to old external-link launch for rollback.
- [ ] Run and pass targeted tests for embedded mode and standalone regression.

## Files Expected To Change

Homepage:

- homepage/src/app/templates/TemplateList.tsx
- homepage/src/app/layout.tsx
- homepage/src/app/components/AppShell.tsx
- homepage/src/app/(public)/editor/page.tsx (new)
- homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx (new)
- homepage/src/shared/auth/useAuthState.ts
- homepage/src/app/@modal/(.)login/LoginModalShell.tsx
- homepage/next.config.ts

FE Editor:

- fe/apps/editor/vite.config.js
- fe/apps/editor/src/App.tsx
- fe/apps/editor/src/main.tsx
- fe/apps/editor/src/shared/hooks/useAuth.ts
- fe/apps/editor/src/shared/auth/tokenStore.ts
- fe/apps/editor/src/shared/hooks/useTemplate.ts
- fe/apps/editor/src/widgets/LoginPopup.tsx
- fe/apps/editor/src/embedded/EditorRemoteEntry.tsx (new)
- fe/apps/editor/src/embedded/EditorHostBridge.tsx (new)

## Definition of Done

- Homepage opens editor in-app at /editor with no new window.
- Homepage shell remains visible while editing.
- Embedded editor has no internal top header.
- Embedded editor never shows its own login modal.
- Homepage auth/session controls embedded editor behavior.
- Standalone editor mode remains functional.
