
import { fetchPageText } from "../lib/fetchpage";

const tests = [
  "https://example.com",
  "http://localhost:3000",
  "http://127.0.0.1",
  "http://169.254.169.254/latest/meta-data/",
  "http://[::1]/",
  "http://10.0.0.1",
  "file:///etc/passwd",
  "https://user:pass@example.com",
  "http://example.com:8080",
  "https://example.com/this-page-does-not-exist",
];

async function main() {
  for (const u of tests) {
    try {
      const r = await fetchPageText(u);
      console.log("ALLOWED ", u, "->", r.text.slice(0, 50).replace(/\s+/g, " "));
    } catch (e) {
      console.log("REFUSED ", u, "->", e instanceof Error ? e.message : e);
    }
  }
}

main();