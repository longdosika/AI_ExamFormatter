# Rules
## Related
- [[00-index]]
- [[tasks]]
- [[decisions]]
- [[memory]]
## Working Principles
- Use the generated documents as the single source of context.
- Implement work task by task instead of asking AI to build everything at once.
- Register every Feature, Bug, Refactor, or Security Fix as a task before editing code.
- Write generated outputs in thai.
- After changing code, update the Project Knowledge Vault links and affected source-of-truth documents.
## Mandatory Change Intake
- Create a Task ID in [[tasks]] before editing code for a new request.
- Record Type, Problem, Acceptance Criteria, Affected Files, and Verification Plan.
- Use the lifecycle Proposed -> Ready -> In Progress -> Verified -> Done.
- Do not mark a task Done until code, verification, and affected knowledge documents agree.
## UAT & Regression Testing Protocol
- Every feature or bug fix pass MUST include UAT testing and record test results in `evidence/uat-checklist.md` following the UAT Checklist format.
- Regression testing of related existing features is mandatory for every pass to ensure previously resolved issues never re-emerge.

## README AI Butler Dashboard Rule
- README.md must serve as the single, complete, zero-friction AI Butler Dashboard ("พ่อบ้านอธิบายงาน").
- At the end of every pass, update README.md so that anyone reading ONLY README.md understands:
  - Current work in progress and status
  - Pending tasks and next steps
  - History of encountered problems, decisions, and fix results
  - Audit trail (who requested, who executed, timestamp, affected files)
  - Testing & UAT verification status

## Supreme Google Doc Constitution Rule
- The Official QuizFlow Google Doc template (`https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`) is the **Supreme Reference Target (คัมภีร์ทำงานสูงสุด)** for all document outputs.
- Every parsing, layout formatting, image capture, and Google Doc output generation logic MUST achieve 100% compliance with this template benchmark.

## File Purpose & Graph Discipline (No Floating/Empty Files)
- Do NOT create unnecessary, empty, unlinked, or floating `README.md` or documentation files.
- Every created file MUST have a clear technical/business purpose, future utility, and explicit graph linkage within [[00-index]].

## Knowledge Update Checklist
- Update [[tasks]] when work is completed, blocked, or reprioritized.
- Update [[prd]] when product behavior, scope, users, or success criteria change.
- Update [[architecture]] when implementation structure, APIs, database, auth, deployment, or integrations change.
- Update [[decisions]] when AI or the team makes a meaningful tradeoff or assumption.
- Update [[00-index]] when new notes, sections, or important links are added.
- Update README.md as the AI Butler Dashboard for seamless handoffs.
## Technical Notes
- Master Design Constitution: [[design]] (Google Doc template: `https://docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ/edit?tab=t.0`) — Supreme Target
- Case Decisions & Lessons Learned: persist and expose historical case decisions for AI/human review