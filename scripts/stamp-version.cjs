const fs = require('fs');
const path = require('path');

function getVersionStamp() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find(p => p.type === type)?.value || '';
  const yy = get('year');
  const mm = get('month');
  const dd = get('day');
  const hh = get('hour');
  const min = get('minute');
  return `${yy}${mm}${dd}-${hh}${min}`;
}

const version = getVersionStamp();
const versionFile = path.join(__dirname, '..', 'lib', 'version.ts');
const content = `/**
 * Application Version Stamp
 * Conforms to git commit format: yymmdd-hhmm
 * Auto-updated on build
 */
export const APP_VERSION = "${version}";
`;
fs.writeFileSync(versionFile, content, 'utf8');

// Invalidate app/page.tsx so Next.js static generation always incorporates the updated version stamp
const pageFile = path.join(__dirname, '..', 'app', 'page.tsx');
if (fs.existsSync(pageFile)) {
  try {
    let pageContent = fs.readFileSync(pageFile, 'utf8');
    const stampRegex = /\/\* BUILD_STAMP: [^*]+ \*\//;
    const newStamp = `/* BUILD_STAMP: ${version} */`;
    if (stampRegex.test(pageContent)) {
      pageContent = pageContent.replace(stampRegex, newStamp);
    } else {
      pageContent += `\n${newStamp}\n`;
    }
    fs.writeFileSync(pageFile, pageContent, 'utf8');
  } catch {}
}

console.log('Stamped APP_VERSION:', version);
