# Contactor Project Memory

This folder is the durable project context for Contactor. It is intended to live in the repository so ChatGPT, Cursor, and future coding agents can work from the same source of truth instead of relying on a long chat history.

## Start here

1. Read `AGENTS.md` before making code changes.
2. Read `docs/CURRENT_STATE.md` for the latest project status.
3. Read `docs/ARCHITECTURE.md` before changing workflow, scheduling, tenancy, auth, billing, or AI behavior.
4. Read `docs/DECISIONS.md` before changing a previously settled product or architecture choice.
5. Use `docs/ROADMAP.md` and `docs/LAUNCH_PLAN.md` to choose work; do not treat the parking lot as implementation authorization.

## Maintenance rule

When a code change materially changes product behavior, architecture, workflow, UI standards, or project status, update the relevant document in the same commit.

## Source snapshot

Initial version created from the uploaded `app`, `components`, `lib`, and `docs` code snapshot plus the 2026-08-29 AI Receptionist Workflow Handoff and current owner direction as of 2026-09-02.

This snapshot did **not** include the full repository root, database migrations/schema, package manifest, deployment configuration, or test suite. Statements about those areas are intentionally limited.
