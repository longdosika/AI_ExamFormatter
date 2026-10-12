# Verification Evidence

Store reviewable proof here when automated tests cannot cover an OS, device, browser, installer, notification, tray, sleep/resume, or other runtime behavior.

## Evidence Levels

1. Document consistency - Knowledge Vault links, IDs, statuses and paths agree.
2. Automated behavior - a real test command ran and its result is recorded.
3. Platform runtime - the built app ran in the target environment and the observed result is recorded here.
4. Distribution - an installer or release artifact was built, installed and smoke-tested when the product requires one.

## File Naming

Use `T-XXX-short-check.md`, for example `T-008-windows-tray.md`. Supporting logs or screenshots may use the same prefix.

## Required Contents

- Task and Requirement IDs
- Date, environment, OS/device/browser and build identifier
- Exact steps or command that ran
- Expected result and observed result
- Pass or fail conclusion
- Artifact paths such as logs or screenshots
- Remaining limitations or follow-up Task

## Referencing Evidence

A completed Feature Note should use a project-relative path, for example:

- Manual checks: Verified with `evidence/T-008-windows-tray.md`
- Runtime checks: Verified with `evidence/T-008-packaged-startup.md`

Do not create evidence from memory. Record only checks that actually ran.