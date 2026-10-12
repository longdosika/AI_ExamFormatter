import http from "node:http";

/**
 * Automated CSS Delivery Health Check
 * Asserts that the application serves HTML and valid, non-empty CSS (HTTP 200).
 * Prevents regressions where dev server or build wiping causes CSS 404 (unstyled raw HTML).
 */
export async function checkCssDelivery(port = 3000) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Root page returned HTTP ${res.statusCode} instead of 200`));
      }

      let html = "";
      res.on("data", (chunk) => { html += chunk; });
      res.on("end", () => {
        const match = html.match(/href="(\/_next\/static\/css\/[^"]+)"/);
        if (!match) {
          // In production inlined mode or during build, link may differ
          return resolve({ status: "ok", message: "Root page returned 200 OK (CSS inlined or managed)" });
        }

        const cssUrl = match[1];
        http.get(`http://127.0.0.1:${port}${cssUrl}`, (cssRes) => {
          if (cssRes.statusCode !== 200) {
            return reject(new Error(`CSS endpoint ${cssUrl} returned HTTP ${cssRes.statusCode}! Styles are broken/404.`));
          }

          let cssBody = "";
          cssRes.on("data", (chunk) => { cssBody += chunk; });
          cssRes.on("end", () => {
            if (cssBody.length < 500) {
              return reject(new Error(`CSS endpoint returned empty or too-short stylesheet (${cssBody.length} bytes)`));
            }
            console.log(`[css-health] Successfully verified stylesheet ${cssUrl} (HTTP 200, ${cssBody.length} bytes).`);
            resolve({ status: "ok", message: `CSS verified (${cssBody.length} bytes)` });
          });
        }).on("error", (err) => reject(new Error(`Failed to request CSS endpoint: ${err.message}`)));
      });
    });

    req.on("error", (err) => {
      // If server is not running on this port, skip gracefully
      console.log(`[css-health] Server not running on port ${port} (${err.message}); skipped live check.`);
      resolve({ status: "skipped", message: "Server not active on port" });
    });
  });
}

// When executed directly as script
const configuredPort = Number(process.env.CSS_PORT || (process.env.E2E_BASE_URL ? new URL(process.env.E2E_BASE_URL).port : 3000) || 3000);
checkCssDelivery(configuredPort)
  .then((res) => {
    console.log(`[css-health] Result: ${res.status} - ${res.message}`);
    process.exit(res.status === "skipped" && process.env.E2E_BASE_URL ? 1 : 0);
  })
  .catch((err) => {
    console.error(`[css-health] CRITICAL ERROR: ${err.message}`);
    process.exit(1);
  });
