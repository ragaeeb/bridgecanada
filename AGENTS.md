# Agent Guide

Welcome! This repository is a static, scroll-driven **Astro** application for Bridge Canada managed with Bun.

## General Workflow
- Use **Bun** for dependency management and scripts (`bun install`, `bun run dev`, `bun run build`, `bun run check`, `bun run lint`, `bun run format`, `bun run deploy`).
- Static exports are enabled (`output: 'static'`), building to `dist/` and configured for Cloudflare Workers / Pages via `wrangler.json`. Avoid features that require a server-only runtime.
- For interactive checking and production validation, use `bun run check` and `bun run build`.

## Code Style & Standards
- Follow TypeScript strictness (`tsconfig.json` extending `astro/tsconfigs/strict` with `ESNext` target & module resolution).
- Keep pages inside `src/pages`, styles in `src/styles/global.css`, client scripts in `src/scripts`, and static assets in `public/assets`.
- Use Biome (`bun run lint`, `bun run format`) for linting and formatting.

## Verification & Build Checks
- Run `bun run check` and `bun run build` before submitting changes to ensure type safety and successful static builds.
- Run `bun run lint` to verify code quality.

## Documentation
- Update `README.md`, `ASSET_MANIFEST.md`, `TIMELINE.md`, or `VERIFICATION.md` when user-facing scripts, asset structures, or workflows change.
