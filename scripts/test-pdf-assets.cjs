const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
assert.ok(fs.statSync(path.join(root, "public", "pdf.worker.min.js")).size > 100_000);
for (const folder of ["cmaps", "standard_fonts"]) {
  const entries = fs.readdirSync(path.join(root, "public", "pdf-assets", folder));
  assert.ok(entries.length > 0, `PDF ${folder} asset directory must not be empty`);
}
console.log("PDF renderer assets are local and available (worker/cmaps/standard fonts).");
