# Implement Next Task

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร pdf / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Before editing code:
1. Read AGENTS.md.
2. If this request is not already represented by a task, create a Task ID in tasks.md with Type, Problem, Acceptance Criteria, Affected Files, and Verification Plan.
3. Summarize which knowledge documents may be affected.
4. Move the task to In Progress. Only then begin implementation.

Use tasks.md as the source of truth. Pick the highest-priority unfinished task, state key assumptions, implement it, run relevant verification, move it to Verified, then update affected generated documents. Mark it Done only after the Definition of Done is satisfied.