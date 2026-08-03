# Homepage Project Context (homepage)

## What This Project Is
This is a separate Next.js application for the public site and account-facing pages.

- Framework: Next.js (App Router)
- UI stack: React + Tailwind
- Includes server route handlers that proxy some requests to backend

## Main Commands
Run from this folder.

```bash
yarn install
yarn dev
```

Build/start:

```bash
yarn build
yarn start
```

## Backend Integration
This app integrates with backend (be) in two ways.

1. Direct browser calls for auth in some client modules:
   - Uses NEXT_PUBLIC_BE_API_BASE (fallback http://localhost:4000)
   - Example endpoint: /api/v1/auth/login

2. Next.js server proxy routes under src/app/api/*:
   - Forward to backend using BE_URL (fallback http://localhost:4000)
   - Common proxied resources: user, categories, templates

## Important Environment Variables
- NEXT_PUBLIC_BE_API_BASE: browser-visible backend base URL
- BE_URL: server-side backend base URL for Next route handlers

## Relationship To Other Projects
- Depends on be for auth and domain data (categories/templates/user profile).
- Independent from fe Nx workspace; it is a separate app with its own build/runtime.
- Conceptually overlaps with fe on auth and template domain, but with different UI/runtime layer.

## Quick Mental Model
If homepage data/auth breaks:

1. Verify backend is up at expected URL.
2. Check NEXT_PUBLIC_BE_API_BASE and BE_URL values.
3. Determine whether failing call is direct browser call or proxied via /app/api route.
4. Validate cookies/auth header forwarding in proxy routes.
