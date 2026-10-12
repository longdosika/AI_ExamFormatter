# AGENTS.md

Project: AI Exam Formatter

## Purpose

Keep implementation and the Project Knowledge Vault synchronized. These rules apply to every AI coding session, including short follow-up requests.

## Mandatory Change Intake

- Before editing code for a Feature, Bug, Refactor, or Security Fix, create or update a Task ID in `documents/tasks.md`.
- Record Type, Problem, Status, Acceptance Criteria, Affected Files, and expected verification.
- Use the lifecycle `Proposed -> Ready -> In Progress -> Verified -> Done`.
- If the request is ambiguous or evidence is weak, create a confirmation task instead of inventing requirements.
- Do not begin implementation until the task is `In Progress`.

## Impact Check Before Code

State which available knowledge files may be affected before implementation:
- `documents/tasks.md`
- `documents/prd.md`
- `documents/architecture.md`
- `documents/design.md`
- `documents/decisions.md`
- `documents/traceability.md`
- `documents/code-map.md`
- `documents/memory.md`
- `documents/00-index.md`

## Definition Of Done

A task is not Done until all applicable checks pass:
- Run `node scripts/finish-task.mjs` and require a successful exit before reporting completion.
- The requested behavior is implemented within the registered task scope.
- Relevant verification has run and its result is recorded in the task.
- Manual, device, installer, or platform-runtime verification links to an existing artifact under evidence/.
- Affected source-of-truth documents are synchronized with the code.
- Meaningful tradeoffs or assumptions are recorded in decisions.md when available.
- Durable context is recorded in memory.md when available.
- The task is moved to `Verified` before `Done`.
- Feature work completes `Requirement -> Task -> Feature Note -> Code Map -> Verification` in `documents/traceability.md` when available.
- Bug work links to the existing Feature Note and records regression verification; do not create a new Requirement unless expected behavior changes.
- Refactor work updates the existing Feature Note and Code Map, plus Architecture when structure changes.

## Required Handoff

End every implementation pass with: Task ID, code changed, tests run, knowledge files updated, and remaining risks or assumptions.

## Mandatory Completion Report (User Governance Rule)

Every completed troubleshooting or implementation pass must explicitly report:

- ปัญหาที่พบและตรวจสอบเจอ (symptom, root cause, and evidence)
- งานที่แก้ไขและเหตุผลของการแก้
- สิ่งที่ทดสอบ คำสั่งที่ใช้ และผลลัพธ์จริง
- ไฟล์ความรู้และหลักฐานที่อัปเดต
- งานที่ยังค้าง, blocker, risk, and required owner/action
- ลิงก์เข้าถึง หรือเหตุผลที่ยังออกลิงก์ไม่ได้
- สิ่งที่ต้องทำต่อในลำดับถัดไป

The report must also contain these five user-required sections in this exact order:

1. ปัญหาที่พบและตรวจสอบเจอ
2. งานที่ทำไป ที่มีการบันทึกและบทเรียนที่ถูกบันทึกจริง
3. งานที่กำลังจะทำ
4. สิ่งที่จะให้ผู้ใช้ทำ
5. ลิงก์ และข้อมูลการเข้าถึงเพื่อทดสอบ

Never report a task as complete or provide an access link unless the link has been opened and the requested flow has been exercised successfully.
