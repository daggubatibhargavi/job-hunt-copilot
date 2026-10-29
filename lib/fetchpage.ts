
import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 500_000;
const MAX_CHARS = 8000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("fc") || v.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(v)) return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (v.startsWith("::ffff:")) return true;
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links are allowed");
  }
  if (url.username || url.password) {
    throw new Error("Links with credentials are not allowed");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new Error("Only standard web ports are allowed");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true });
  if (!addrs.length) throw new Error("Could not resolve that host");
  for (const { address } of addrs) {
    const blocked = net.isIPv6(address)
      ? isPrivateIPv6(address)
      : isPrivateIPv4(address);
    if (blocked) throw new Error("That address is not allowed");
  }
  return url;
}

async function readLimited(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

export async function fetchPageText(rawUrl: string) {
  let url = await assertPublicUrl(rawUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": "JobHuntCopilot/1.0",
        Accept: "text/html,text/plain",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without a location");
      url = await assertPublicUrl(new URL(loc, url).toString());
      continue;
    }
    if (!res.ok) throw new Error(`Page returned HTTP ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/(html|plain)|application\/xhtml/.test(type)) {
      throw new Error("Only HTML or text pages are supported");
    }
    const html = await readLimited(res, MAX_BYTES);
    return {
      finalUrl: url.toString(),
      text: htmlToText(html).slice(0, MAX_CHARS),
    };
  }
  throw new Error("Too many redirects");
}