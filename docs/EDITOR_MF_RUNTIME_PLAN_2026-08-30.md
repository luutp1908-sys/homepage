# Editor runtime federation plan

## Goal
Load the FE editor as a runtime federated remote from the homepage host, without using the incompatible `nextjs-mf` App Router plugin path.

## Root cause
The homepage app is on Next.js App Router. The earlier `@module-federation/nextjs-mf` integration path fails in this app structure and triggers the known "App Directory is not supported by nextjs-mf" error. The build-time plugin approach is not viable here.

## Chosen architecture
Use the runtime API from `@module-federation/runtime` to initialize a host and load the remote module at runtime.

## Remote contract
The FE editor remote is configured in `fe/apps/editor/vite.config.js` with:

- remote name: `editor`
- exposed entry: `./EditorRemoteEntry`
- remote entry URL: `http://localhost:5174/remoteEntry.js`

The remote entry component contract is:

```ts
export type EditorRemoteEntryProps = {
  isEmbedded?: boolean;
  auth?: {
    user: {
      id: string;
      email: string;
      displayName: string | null;
      roles?: string[];
      permissions?: string[];
    } | null;
    accessToken: string | null;
    isLoading?: boolean;
  } | null;
  callbacks?: {
    onRequestLogin?: () => void;
    onLogout?: () => Promise<void> | void;
  } | null;
};
```

The host should pass the homepage auth state and login callback through this bridge.

## Steps

1. [x] Phase 1 - Runtime foundation
2. [x] Update dependencies in [homepage/package.json](homepage/package.json): add the enhanced runtime package and remove unused nextjs-mf so the host no longer depends on incompatible plugin wiring.
3. [x] Keep [homepage/next.config.ts](homepage/next.config.ts) minimal (no federation plugin) and ensure scripts still run webpack mode.
4. [ ] Phase 2 - Host runtime loader
5. [ ] Refactor [homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx](homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx) to runtime-load the remote: init runtime once, register remote URL, load share scope, load exposed module, and render the default export via lazy/Suspense.
6. [ ] Keep the current loading fallback and error boundary behavior in [homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx](homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx), with explicit logging for remote-load failures.
7. [ ] Preserve the current embedded props bridge (auth + callbacks) into the loaded remote component in [homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx](homepage/src/app/(public)/editor/EmbeddedEditorHost.tsx).
8. [ ] Phase 3 - Contract compatibility
9. [ ] Verify the host declaration in [homepage/src/types/federation.d.ts](homepage/src/types/federation.d.ts) matches the remote props shape in [fe/apps/editor/src/embedded/EditorRemoteEntry.tsx](fe/apps/editor/src/embedded/EditorRemoteEntry.tsx).
10. [ ] Verify the expose key and remote entry filename remain stable in [fe/apps/editor/vite.config.js](fe/apps/editor/vite.config.js); only adjust FE config if runtime resolution fails.
11. [ ] Phase 4 - Rollback safety
12. [ ] Add an env feature flag in homepage to switch the embedded runtime mode on/off without code rollback.
13. [ ] Update [homepage/src/app/templates/TemplateList.tsx](homepage/src/app/templates/TemplateList.tsx) to respect the flag: embedded on -> internal `/editor`; embedded off -> legacy external editor URL, while preserving `templateId`, `workspaceId`, and `adminEdit` query params.
14. [ ] Phase 5 - Verification
15. [ ] Validate the dual-app local run: homepage boots cleanly, remote serves `remoteEntry`, template click transitions to `/editor`, shell stays visible, and the remote mounts.
16. [ ] Validate failure and rollback modes: remote down shows fallback UI; flag off uses external launch; login action still delegates to the homepage flow.

## Notes
This is the correct migration away from `nextjs-mf` because the homepage is App Router based and does not support the plugin pattern. Runtime federation is the stable path for this architecture.
