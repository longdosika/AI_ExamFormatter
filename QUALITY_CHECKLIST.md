# Project Quality Checklist

Project: AI Exam Formatter
Project type: web-app

Use this checklist before moving an implementation Task to Verified. Check only items supported by real files and commands in this repository.

## Always Required

- [ ] Run `node scripts/finish-task.mjs` and require a successful exit before Done.
- [ ] Run `node scripts/check-knowledge-vault.mjs`.
- [ ] In Git projects, run `node scripts/check-knowledge-drift.mjs --staged` before commit or compare against the intended base revision.
- [ ] Confirm every documented code, test and workflow path exists.
- [ ] Record the exact commands and results in the active Task.

## Discover Available Project Commands

- Inspect the real project manifest or build files first, such as `package.json`, `pyproject.toml`, `Cargo.toml`, solution files or platform configuration.
- Run build, test, lint, typecheck and security commands only when the project actually defines them.
- If an important command is missing, create a follow-up Task instead of claiming that the check passed.
- Never invent a test filename, command, CI result or installer artifact.

## Behavior Verification Rule

- A successful build proves that code can compile or package; it does not prove that user behavior is correct.
- Core requirements need automated behavior-test evidence before they can be called Verified or Done.
- If the project has no behavior-test command yet, create a Test Setup follow-up Task and keep affected requirements unverified.
- Manual or platform-runtime claims need a project-relative artifact under `evidence/`; a sentence saying Verified is not evidence by itself.

## Platform Checks

- [ ] Run automated behavior tests for core user flows, validation and state changes.
- [ ] Check responsive breakpoints, keyboard access, loading, empty and error states.
- [ ] Review server/client trust boundaries, authentication and authorization when present.
- [ ] Smoke-test the production build and deployed primary flow.

## Handoff Evidence

- [ ] Task ID and final status
- [ ] Implementation files changed
- [ ] Commands run with pass/fail result
- [ ] Knowledge Vault files synchronized
- [ ] Remaining risks, assumptions and follow-up Tasks