# Update Project Context

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร pdf / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
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