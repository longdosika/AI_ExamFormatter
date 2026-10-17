const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "node_modules", "pdfjs-dist");
const publicRoot = path.join(root, "public");

function copy(source, target) {
  if (!fs.existsSync(source)) throw new Error(`Missing pdfjs-dist asset: ${source}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

copy(path.join(packageRoot, "build", "pdf.worker.min.mjs"), path.join(publicRoot, "pdf.worker.min.mjs"));
// The old pre-fix worker is generated output and must not remain publicly served.
fs.rmSync(path.join(publicRoot, "pdf.worker.min.js"), { force: true });
for (const folder of ["cmaps", "standard_fonts"]) {
  const source = path.join(packageRoot, folder);
  const target = path.join(publicRoot, "pdf-assets", folder);
  fs.cpSync(source, target, { recursive: true });
}
console.log("[pdf-assets] synced pdf.js worker, cmaps and standard fonts");
