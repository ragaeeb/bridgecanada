# Agent Guide

Welcome! This repository is a Next.js 16 application managed with Bun.

## General workflow
- Use **Bun** for dependency management and scripts (`bun install`, `bun run build`, `bun dev`).
- Prefer **Turbopack** (already configured) when running dev/build scripts.
- Static exports are enabled, so avoid features that require a server-only runtime.

## Code style
- Follow TypeScript strictness from `tsconfig.json`.
- Keep components colocated inside `src/app` and `src/components`.
- Use Biome (`bun run lint`, `bun run format`) for linting/formatting instead of other tools.

## Testing/build checks
- Run `bun run build` before opening a PR to ensure the static build succeeds.
- If you encounter Google Font TLS issues in Turbopack, ensure the TLS option in `next.config.ts` remains enabled.

## Documentation
- Update `README.md` when user-facing scripts or workflows change.
