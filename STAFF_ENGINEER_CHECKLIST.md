# Staff Engineer Improvement Checklist

Use this as the working checklist for homepage improvements. Tick each item as the implementation is completed.

## Architecture and State

- [x] Make auth state one source of truth across the app.
- [x] Remove the split between cookie-based auth, session storage, and ad hoc token persistence.
- [x] Make active workspace state authoritative across refresh, tabs, and route changes.
- [x] Align cookie, session storage, URL behavior, and server truth for workspace switching.

## API and Route Hardening

- [x] Validate query and body input in all route handlers.
- [x] Standardize error payloads and HTTP status codes.
- [x] Avoid leaking internal errors in API responses.
- [x] Add not-found handling for missing categories and resources.

## SEO and Metadata

- [ ] Expand dynamic metadata per category page.
- [ ] Add canonical URLs and robots policy.
- [ ] Add structured data where it improves search or sharing.

## Data Fetching and Server Logic

- [ ] Reduce duplication in server fetching and environment handling.
- [ ] Consolidate shared fetch patterns, cache rules, and base URL resolution.
- [ ] Keep route handlers, server actions, and server components clearly separated.

## Testing

- [ ] Add integration tests for important route segments and components.
- [ ] Add end-to-end smoke tests for auth, browse, and mutation flows.
- [ ] Cover login, protected pages, browsing, and workspace switching.

## Routing and UX

- [ ] Keep direct login route support for deep links.
- [ ] Verify modal login and return-to behavior stay consistent.
- [ ] Simplify routing boundaries so public, authenticated, and workspace areas stay distinct.

## Cleanup and Maintainability

- [ ] Move shared data access into a small server-only layer.
- [ ] Make browse pages easier to reason about and extend.
- [ ] Remove legacy patterns once the newer flow is fully stable.
