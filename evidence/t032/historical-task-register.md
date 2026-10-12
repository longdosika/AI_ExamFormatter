# T-032 historical acceptance register

รอบนี้ใช้หลักฐาน executable เป็นตัวตัดสิน ไม่รับสถานะเดิมจากเอกสารเพียงอย่างเดียว

| Task | Scope | Re-check owner | Required evidence | Current audit status |
|---|---|---|---|---|
| T-001 | project context | Governance | README/tasks/architecture consistency | Re-audit required |
| T-002 | core feature set | Release QA | end-to-end acceptance | Re-audit required |
| T-003 | success criteria | Release QA | real output and readback | Re-audit required |
| T-004 | file upload | Import owner | browser upload/drop fixtures | Re-audit required |
| T-005 | formatting engine | Parser owner | source fidelity fixtures | Re-audit required |
| T-006 | case decisions | UX/Storage owner | persistence and reload evidence | Re-audit required |
| T-007 | split editor | UI/UX owner | browser editing evidence | Re-audit required |
| T-008 | source viewer | UI/UX owner | PDF/image rendering evidence | Re-audit required |
| T-009 | typography | UI/UX owner | computed style/runtime evidence | Re-audit required |
| T-010 | viewer/magnifier | UI/UX owner | interaction E2E | Re-audit required |
| T-011 | capture engine | UI/UX owner | crop/magnifier E2E | Re-audit required |
| T-012 | native PDF canvas | Import owner | PDF rendering/resource evidence | Re-audit required |
| T-013 | sequence/reset | QA owner | reset/reupload E2E | Re-audit required |
| T-014 | backlog audit | Governance | audit log and evidence links | Re-audit required |
| T-015 | parser regression | Parser owner | parser tests | Re-audit required |
| T-016 | local cases/export honesty | Storage owner | case/export tests | Re-audit required |
| T-017 | Google Docs export | Integration owner | authenticated live readback | BLOCKED: credentials |
| T-018 | OCR/input/image mapping | OCR owner | real scanned-PDF fixture | BLOCKED: provider key |
| T-019 | runtime acceptance | QA owner | browser E2E | BLOCKED: local server |
| T-020 | production build | Release QA | clean build | Re-audit required |
| T-021 | responsive/accessibility | UI/UX owner | desktop/mobile E2E | Re-audit required |
| T-022 | performance | Performance owner | benchmark/resource tests | Re-audit required |
| T-023 | quality gates | QA owner | lint/test/build/finish gate | Re-audit required |
| T-024 | authenticated export | Integration owner | OAuth callback/readback | BLOCKED: credentials |
| T-025 | fallback/header | UI/UX owner | import/reset E2E | Re-audit required |
| T-026 | Monday audit | Governance | Weekly_Audit and automation | Re-audit required |
| T-027 | split viewport/fallback | UI/UX + parser | source mismatch regression | Re-audit required |
| T-028 | CSS/build isolation | Release QA | CSS health and build | Re-audit required |
| T-029 | Thai PDF extraction | Parser/import | real PDF text evidence | Re-audit required |
| T-030 | Typhoon OCR | OCR owner | live provider import | REOPENED |
| T-031 | OCR contract | OCR/parser | structured fixture + real PDF | IN PROGRESS |

## Required closure order

1. Resolve T-018/T-030/T-031 with a real OCR provider key and the supplied PDF.
2. Resolve T-019/T-023/T-032 in a clean clone with an isolated preview port.
3. Re-run T-017/T-024 only after authenticated Google readback is available.
4. Only then promote historical tasks to `Verified`/`Done` with command output and artifact links.
