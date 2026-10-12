# AI Development Workflow

Project: AI Exam Formatter
Target workflow: Generic Agent
Workflow style: Tool-agnostic, markdown-first, easy to adapt

This file is the universal workflow for every AI coding tool used in this repository. Tool-specific files must point here instead of creating a second source of truth.

## Before Editing Code

1. Read `AGENTS.md`, this file, and `CHANGE_REQUEST.md` when the user is requesting a change.
2. Read the relevant Project Knowledge Vault files:
   - `documents/tasks.md`
   - `documents/prd.md`
   - `documents/architecture.md`
   - `documents/design.md`
   - `documents/decisions.md`
   - `documents/traceability.md`
   - `documents/code-map.md`
   - `documents/memory.md`
   - `documents/00-index.md`
3. Create or update one canonical `T-XXX` record before changing implementation files.
4. Record Type, Problem, Acceptance Criteria, Affected Files and Verification Plan.
5. Move the Task to `In Progress` only after scope and impact are clear.

## While Implementing

- Work within the active Task scope and keep changes reviewable.
- Update the linked Feature Note when behavior, code paths, tests or risks change.
- Update `documents/traceability.md` and `documents/code-map.md` with real wikilinks and project-relative paths.
- Update Architecture or Decisions when package, build, CI, data, integration or structural choices change.
- Never record a file, test or command as verified unless it exists and actually ran.
- Store reviewable manual or runtime proof under `evidence/` and link it from the Feature Note.

## Before Saying Done

1. Run `node scripts/finish-task.mjs` as the mandatory completion gate.
2. Fix every reported semantic, platform-readiness, Git drift, missing-test or discovered quality-command failure.
3. Record the exact completion-gate commands and results in the active Task.
4. Move the Task through `Verified` to `Done` only after the gate exits successfully and code and knowledge agree.

## Required Handoff

Report the Task ID, code changed, checks run, Knowledge Vault files updated, and remaining risks or assumptions.