# Next.js Learning Features Roadmap

This roadmap captures the key features to implement in the current homepage project so you can practice the most important Next.js concepts end-to-end.

## How to use this file

- Mark each item complete as you implement it.
- Keep notes under each feature for decisions and trade-offs.
- Prefer small PRs: one feature or one sub-step per PR.

## 1. Caching and Revalidation Strategy

- [x] Define which pages are static, dynamic, and revalidated.
- [x] Use cache and revalidate settings intentionally for data fetches.
- [x] Add invalidation flow after template/category updates.

Concepts:
- Server Components data caching
- Revalidation windows
- Cache invalidation patterns

Target files:
- src/app/page.tsx
- src/app/[categorySlug]/page.tsx
- src/app/lib/seo.ts
- src/app/api/templates/route.ts

Done when:
- You can explain why each route is static or dynamic.
- Fresh data appears after a mutation without manual refresh hacks.

## 2. Route Segment Loading/Error/Not-Found Boundaries

- [x] Add loading boundaries for slow segments.
- [x] Add error boundaries for segment-level failures.
- [ ] Add not-found handling for missing categories/resources.

Concepts:
- Segment isolation in App Router
- Better failure UX

Target routes:
- src/app/page.tsx
- src/app/[categorySlug]/page.tsx
- src/app/workspaces/page.tsx

Done when:
- Failures in one segment do not crash the whole app view.

## 3. Server Actions for Mutations

- [ ] Implement create/update mutations with Server Actions.
- [ ] Add optimistic UI where safe.
- [ ] Keep API route handlers only where they add value.

Concepts:
- Server Actions
- Progressive enhancement
- Optimistic updates

Target files:
- src/app/workspaces/CreateWorkspaceModal.tsx
- src/app/workspaces/WorkspacesPageClient.tsx
- src/app/account/page.tsx

Done when:
- Main write flows work without verbose client fetch boilerplate.

## 4. Auth Guard at Routing Layer

- [ ] Protect private routes and redirect unauthenticated users.
- [ ] Preserve return-to behavior after login.
- [ ] Keep auth checks consistent between page and API usage.

Concepts:
- Route protection
- Redirect flows
- Session-aware rendering

Target files:
- src/app/components/AuthNav.tsx
- src/shared/auth/useAuth.ts
- src/app/api/user/me/route.ts

Done when:
- Protected pages are not accessible without valid auth state.

## 5. Intercepting/Parallel Route Login Modal

- [ ] Add modal route flow for sign-in without losing current context.
- [ ] Keep direct login route support for deep links.

Concepts:
- Intercepting routes
- Parallel routes
- Modal routing UX

Target area:
- src/app/login/page.tsx
- src/app/layout.tsx
- src/app/components/AuthNav.tsx

Done when:
- Login can open as modal from current page and still support direct route navigation.

## 6. Streaming and Suspense for Browse Experience

- [ ] Split page so shell renders first and lists stream later.
- [ ] Add Suspense boundaries around expensive data sections.

Concepts:
- Streaming SSR
- Suspense in App Router

Target files:
- src/app/templates/TemplateList.tsx
- src/app/templates/Categories.tsx
- src/app/page.tsx

Done when:
- Initial page shell appears quickly and data-heavy sections stream in.

## 7. Advanced Metadata and SEO

- [ ] Expand dynamic metadata per category page.
- [ ] Add canonical URLs and robots policy.
- [ ] Add structured data where relevant.

Concepts:
- Metadata API
- Dynamic SEO content
- Canonical consistency

Target files:
- src/app/page.tsx
- src/app/[categorySlug]/page.tsx
- src/app/lib/seo.ts

Done when:
- Each page emits stable, correct metadata for share and search.

## 8. API Route Hardening

- [ ] Validate query/body input in route handlers.
- [ ] Standardize error payloads and status codes.
- [ ] Avoid leaking internal errors.

Concepts:
- Route Handler robustness
- Validation and safe error design

Target files:
- src/app/api/categories/route.ts
- src/app/api/templates/route.ts
- src/app/api/workspaces/route.ts

Done when:
- Invalid requests return clear 4xx errors with stable response shape.

## 9. Workspace Context Consistency

- [ ] Ensure active workspace state is consistent across refresh and tabs.
- [ ] Reconcile URL state, local persistence, and server truth.

Concepts:
- Client/server state synchronization
- Workspace-scoped UX

Target files:
- src/shared/workspaces/useActiveWorkspace.ts
- src/app/api/workspaces/active/route.ts
- src/app/workspaces/[workspaceId]/WorkspaceLegacyRedirectClient.tsx

Done when:
- Switching workspace is reliable and reflected across pages and API calls.

## 10. Testing Pyramid for App Router

- [ ] Add unit tests for pure logic/selectors/utils.
- [ ] Add integration tests for important route segments/components.
- [ ] Add end-to-end smoke tests for auth + browse + mutation path.

Concepts:
- Testing strategy for Next.js App Router
- Confidence in routing and data flows

Target areas:
- src/app/api/user/me/route.ts
- src/app/login/LoginPageClient.tsx
- src/app/workspaces/page.tsx

Done when:
- Critical user paths have automated coverage and pass in CI.

## Suggested implementation order

1. Caching/Revalidation
2. Loading/Error/Not-Found
3. Server Actions
4. Auth Guard
5. Streaming/Suspense
6. SEO expansion
7. API hardening
8. Workspace consistency
9. Route modal/intercepting flows
10. Testing pyramid and CI stabilization
