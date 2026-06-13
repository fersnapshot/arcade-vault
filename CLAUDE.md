# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users compete for the highest score. Uses **Spec Driven Design** via `/spec` and `/spec-impl` skills.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16.2.9** with App Router — read `node_modules/next/dist/docs/` before writing any code; APIs differ from prior versions
- **React 19.2.4** with React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- **Tailwind CSS v4** — PostCSS-based, config in `postcss.config.mjs`; v4 syntax differs from v3
- **TypeScript**

## Architecture

App Router only — no Pages Router. All routes live under `src/app/`. Root layout at `src/app/layout.tsx` sets up Geist fonts and a flex column body.

React Compiler is active, so manual `useMemo`/`useCallback` optimizations are unnecessary and should be avoided.

## Workflow

Features are built spec-first: use `/spec` to write a spec, then `/spec-impl` to implement it. Follow the guidelines at <https://github.com/Klerith/fernando-skills>.
