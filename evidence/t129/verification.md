# T-129 Verification (2026-10-17)

Header rail merged to four entries: คลังไฟล์, แบบร่าง/ประวัติ, เครื่องมือ (menu), แม่แบบ.

| Check | Command / action | Result |
|---|---|---|
| Types | `npx tsc --noEmit -p .` | exit 0 |
| Full E2E on dev 127.0.0.1:3121 | `E2E_BASE_URL=http://127.0.0.1:3121 npm run test:e2e` | exit 0 (test-e2e.log); new line "Filename import history persists in the drafts list; tools menu closes on Escape" |
| Production build | `NEXT_DIST_DIR=.next-production-t129 npm run build` | exit 0, stamp 261017-1543 (first build 261017-1540 replaced after the empty-history wording fix) |
| Deployed localhost:3000 | badge 261017-1543, CSS 200; test-e2e, test-library-ui, test-workspace-controls, test-t128-duplicate-import | all exit 0 (deployed-*.log) |
| Browser pane on localhost:3000 | opened the drafts dialog (title แบบร่างและประวัติไฟล์นำเข้า, section ประวัติไฟล์นำเข้า, empty text "ยังไม่มีประวัติการนำเข้าในเบราว์เซอร์นี้"); opened the tools menu (สถิติ / ดาวน์โหลดสถิติ / บันทึกปัญหา shown below the rail, not clipped) | ok |

Not covered: the browser pane profile has no saved drafts, so the per-draft "นำเข้า N ครั้ง" line was checked only by test-e2e (source.md imported twice).
