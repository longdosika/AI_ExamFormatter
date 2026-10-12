const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const context = await browser.newContext();
    const cross = await context.request.get('http://127.0.0.1:3001/api/google/auth',{maxRedirects:0});
    assert.equal(cross.headers().location,'http://localhost:3000/api/google/auth');
    assert.ok(!cross.headers()['set-cookie'],'canonical redirect does not issue state on wrong host');
    const auth = await context.request.get('http://localhost:3000/api/google/auth',{maxRedirects:0});
    assert.equal(auth.status(),307);
    const google = new URL(auth.headers().location);
    assert.equal(google.origin,'https://accounts.google.com');
    assert.equal(google.searchParams.get('redirect_uri'),'http://localhost:3000/api/google/callback');
    assert.ok(auth.headers()['set-cookie'].includes('quizflow_google_state='));
    await context.clearCookies();
    const page = await context.newPage();
    await page.goto('http://localhost:3000/api/google/callback');
    assert.ok(page.url().includes('reason=missing_state'));
    await page.getByText(/ไม่พบรอบเชื่อมต่อเดิม/).waitFor();
    await page.getByRole('link',{name:'เชื่อมบัญชี Google',exact:true}).waitFor();
    await page.locator('input[type=file]').setInputFiles({name:'origin-check.md',mimeType:'text/markdown',buffer:Buffer.from('1. Canonical origin source\nก. one\nข. two\nค. three\nง. four')});
    await page.locator('[contenteditable=true]').waitFor();
    assert.match(await page.locator('[contenteditable=true]').innerText(),/Canonical origin source/);
    await page.screenshot({path:'evidence/t046-canonical-browser.png'});
    fs.writeFileSync('evidence/t046-result.json',JSON.stringify({status:'passed',canonicalOrigin:'http://localhost:3000',crossHostRedirect:true,stateCookieOnlyOnCanonicalHost:true,registeredRedirectMatches:true,missingStateRecovery:true,canonicalImport:true,liveGoogleConsent:'pending user sign-in',googleExport:'not certified by this test'},null,2));
    console.log('Canonical auth redirect, Google redirect URI, state cookie, safe callback recovery and import passed; live consent remains pending.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
