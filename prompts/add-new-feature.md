# Add New Feature

Project: AI Exam Formatter
Type: Web App
Documents available: 00-index.md, prd.md, design.md, architecture.md, rules.md, tasks.md, traceability.md, code-map.md, memory.md, decisions.md, context.md, api.md
Primary goal: Create a web app ที่แปลงเอกสาร pdf / รูปภาพ / doc / google doc / md file ให้ถูกแบ่งสัดส่วน จัดรูปแบบ ให้เข้า format ตามที่กำหนดไว้
Prompt pack level: standard
Platform instruction: Treat this as a browser-based web application first. Prefer responsive web implementation unless the documents explicitly request native mobile or desktop code.
Respond in Thai unless code or technical identifiers should remain in English.

Read AGENTS.md and CHANGE_REQUEST.md first. Before editing code, decide whether the request needs a new Requirement or implements an existing one. Create or update the Requirement ID, register a Feature Task, create a Feature Note from features/FEATURE_TEMPLATE.md, and update documents/traceability.md with the planned relationship.

After implementation, update the Feature Note, documents/code-map.md, verification evidence, affected source-of-truth documents, and move the task through Verified to Done only when every link is current.