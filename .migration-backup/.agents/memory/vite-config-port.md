---
name: Vite config PORT issue
description: vite.config.ts must not crash when PORT or BASE_PATH env vars are missing during CI/Vercel builds.
---

The original vite.config.ts threw hard errors if PORT or BASE_PATH were not set. Vercel (and any CI build) does not set these at build time — PORT is a runtime concept and BASE_PATH is a Replit-specific routing var.

**Rule:** Always use optional chaining / nullish coalescing for PORT and BASE_PATH in vite.config.ts.

```ts
const port = Number(process.env.PORT ?? "3000") || 3000;
const basePath = process.env.BASE_PATH ?? "/";
```

Also gate Replit-specific plugins (cartographer, dev-banner, runtime-error-modal) behind `process.env.REPL_ID !== undefined` so they don't load on Vercel.

**Why:** Vercel build runs `vite build` without Replit env vars. Throwing at config load time fails the entire build.

**How to apply:** Any time vite.config.ts is modified, ensure PORT/BASE_PATH have fallbacks and Replit plugins are gated.
