// T-128: importing a file seen before now asks "ไฟล์นี้เคยนำเข้าแล้ว". Older suites re-import the same fixture many
// times and expect a fresh import, so requiring this helper answers "นำเข้าใหม่" automatically after every
// setInputFiles. Suites that test the dialog itself (test-t128-duplicate-import, test-t125-cached-ocr) do not use it.
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('C:/Users/nathaphat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

const DIALOG = 'ไฟล์นี้เคยนำเข้าแล้ว';
const WAIT = Number(process.env.E2E_DUPLICATE_WAIT || 2500);

function autoConfirmNewImport(page) {
  const proto = Object.getPrototypeOf(page.locator('body'));
  if (proto.__autoNewImport) return;
  const original = proto.setInputFiles;
  proto.setInputFiles = async function (...args) {
    const result = await original.apply(this, args);
    const dialog = this.page().getByRole('alertdialog', { name: DIALOG });
    try {
      await dialog.waitFor({ timeout: WAIT });
      await dialog.getByRole('button', { name: 'นำเข้าใหม่', exact: true }).click();
    } catch { /* no earlier import of this file: nothing to answer */ }
    return result;
  };
  proto.__autoNewImport = true;
}

for (const type of [playwright.chromium, playwright.firefox, playwright.webkit].filter(Boolean)) {
  if (type.__autoNewImport) continue;
  const launch = type.launch.bind(type);
  type.launch = async (...launchArgs) => {
    const browser = await launch(...launchArgs);
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async (...pageArgs) => { const page = await newPage(...pageArgs); autoConfirmNewImport(page); return page; };
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...contextArgs) => {
      const context = await newContext(...contextArgs);
      const contextPage = context.newPage.bind(context);
      context.newPage = async (...pageArgs) => { const page = await contextPage(...pageArgs); autoConfirmNewImport(page); return page; };
      return context;
    };
    return browser;
  };
  type.__autoNewImport = true;
}

module.exports = { autoConfirmNewImport };
