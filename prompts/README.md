# Start Project

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร pdf / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Read all generated documents first. Summarize the project briefly, identify the next task, and begin implementation without drifting outside the documented scope.

# Implement Next Task

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Before editing code:
1. Read AGENTS.md.
2. If this request is not already represented by a task, create a Task ID in tasks.md with Type, Problem, Acceptance Criteria, Affected Files, and Verification Plan.
3. Summarize which knowledge documents may be affected.
4. Move the task to In Progress. Only then begin implementation.

Use tasks.md as the source of truth. Pick the highest-priority unfinished task, state key assumptions, implement it, run relevant verification, move it to Verified, then update affected generated documents. Mark it Done only after the Definition of Done is satisfied.

# Review Output

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Review the implementation against the PRD, architecture, and rules. Focus first on bugs, regressions, security issues, and missing tests.

# Update Project Context

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

After implementation, update the project context documents so the exported blueprint stays current.

Update these files when they are affected:
- tasks.md: status, verification, blocked work, reprioritization, and follow-up tasks
- prd.md: behavior, users, scope, flow, or success criteria when product intent changed
- architecture.md: modules, APIs, database, auth, integrations, deployment, or platform decisions
- rules.md: team or AI operating rules when the working agreement changed
- decisions.md: meaningful tradeoffs, assumptions, risks, accepted constraints, and confirmations
- traceability.md: Requirement, Task, Feature Note, Code, and Verification relationships
- code-map.md: feature ownership, entry points, supporting code, and test locations
- memory.md: durable context needed by future AI sessions
- 00-index.md: new or changed notes, sections, and knowledge links

Rules:
- Do not rewrite documents that were not affected
- Keep updates concise and source-of-truth oriented
- Call out assumptions before editing if the change is ambiguous
- End with a short handoff summary of what changed, what remains, and which documents were updated

# Update Knowledge Base

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Before completing the implementation, synchronize the Obsidian-style Project Knowledge Vault.

Checklist:
- [[tasks]]: status, verification, blocked work, reprioritization, and follow-up tasks.
- [[prd]]: behavior, users, scope, flow, or success criteria when product intent changed.
- [[architecture]]: modules, APIs, database, auth, integrations, deployment, or platform decisions.
- [[rules]]: team or AI operating rules when the working agreement changed.
- [[decisions]]: meaningful tradeoffs, assumptions, risks, accepted constraints, and confirmations.
- [[traceability]]: Requirement, Task, Feature Note, Code, and Verification relationships.
- [[code-map]]: feature ownership, entry points, supporting code, and test locations.
- [[memory]]: durable context needed by future AI sessions.
- [[00-index]]: new or changed notes, sections, and knowledge links.

Rules:
- Update only affected files.
- Preserve uncertainty instead of converting weak assumptions into facts.
- Add confirmation tasks when evidence is weak.
- Finish with a handoff summary: code changed, knowledge files updated, links changed, remaining assumptions.

# Update Memory

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Update memory.md with important decisions, constraints, and vocabulary discovered during implementation. Keep the notes concise and durable.

# Add New Feature

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Read AGENTS.md and CHANGE_REQUEST.md first. Before editing code, decide whether the request needs a new Requirement or implements an existing one. Create or update the Requirement ID, register a Feature Task, create a Feature Note from features/FEATURE_TEMPLATE.md, and update documents/traceability.md with the planned relationship.

After implementation, update the Feature Note, documents/code-map.md, verification evidence, affected source-of-truth documents, and move the task through Verified to Done only when every link is current.

# Fix Bug

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Read AGENTS.md first. Register a Bug Task before editing code and link it to the existing Feature Note and Requirement. Do not create a new Requirement unless expected product behavior changes.

Reproduce the bug, implement the smallest safe fix, add regression verification, update the Feature Note and traceability row, then move the task through Verified to Done only when code and knowledge agree.

# Refactor Code

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร .ยกด / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Read AGENTS.md first. Register a Refactor Task before editing code and link it to the affected Feature Notes. Keep product Requirements unchanged unless behavior intentionally changes.

Define non-goals and verification, refactor safely, update documents/code-map.md and affected Feature Notes, update architecture.md when structure changes, then move the task through Verified to Done.