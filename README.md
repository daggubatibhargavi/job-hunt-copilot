# Job Hunt Copilot

A remote **MCP (Model Context Protocol) server** that turns Claude into a job-search assistant. Connect it to Claude as a custom connector, sign in, and Claude can search for postings, read them, track your applications in Postgres, and tailor your stored resume to a specific job.

Built with Next.js, Clerk (OAuth), Neon Postgres, and Tavily web search. Deployed on Vercel.

> **Status:** personal project. Runs on free tiers and a Clerk *development* instance. See [Known limitations](#known-limitations).

## What it does

Ask Claude things like:

- "Find backend internships in India from this week and save the best two."
- "Read that posting and tailor my resume to it. Only reword what's already there."
- "Which of my applications are still in `saved`? Mark ClickPe as `applied`."

### Tools

| Tool | Purpose |
|---|---|
| `search_jobs` | Web search for postings (optional location and recency filters) |
| `fetch_job_page` | Read a public job posting and return its text |
| `save_application` | Track a job (company, role, link, notes) |
| `list_applications` | List tracked jobs, optionally by status |
| `update_application` | Edit company, role, link or notes |
| `update_application_status` | Move a job through `saved`, `applied`, `interview`, `offer`, `rejected` |
| `delete_application` | Permanently remove a tracked job |
| `save_resume` | Store (or replace) your resume text |
| `get_resume` | Retrieve your resume for tailoring |
| `ping` | Health check |

## Architecture

```mermaid
flowchart LR
  U[User] --> C[Claude]
  C -- "MCP over HTTPS + OAuth token" --> S["Next.js on Vercel<br/>/mcp"]
  S -- "verify token" --> K[Clerk]
  S -- "SQL filtered by user_id" --> N[(Neon Postgres)]
  S -- "search" --> T[Tavily API]
  S -- "guarded fetch" --> W[Public job pages]
```

**Sign-in flow:** Claude reads the server's OAuth discovery metadata (`/.well-known/oauth-protected-resource/mcp`), registers itself with Clerk using Dynamic Client Registration, sends the user to Clerk's sign-in page, and then calls `/mcp` with an access token. Every request is verified before any tool runs.

## Security design

- **Authentication required.** Requests without a valid token get `401`. The MCP route is wrapped with `withMcpAuth` and tokens are verified with Clerk.
- **Per-user data isolation.** Every table has a `user_id` column, and every query filters on the id taken from the verified token, never from tool input. Update and delete statements include `AND user_id = ...`, so guessing another user's row id changes nothing.
- **SQL injection.** All queries use the Neon driver's tagged-template parameters. No string concatenation.
- **Per-user rate limit.** `search_jobs` is capped at 20 searches per rolling 24 hours per user, tracked in Postgres, to protect the search API quota.
- **Safe URL fetching (`fetch_job_page`).** A server that fetches user-supplied links can be abused to reach internal systems (SSRF). The fetcher:
  - allows only `http` and `https`, on ports 80 and 443
  - rejects links containing credentials
  - resolves the hostname and blocks private, loopback, link-local and cloud-metadata addresses (IPv4 and IPv6)
  - follows at most 3 redirects and re-checks every hop
  - applies an 8-second timeout and a 500 KB read cap, and truncates output to 8,000 characters
  - only accepts HTML or plain-text responses
- **Untrusted content labelling.** Search results and fetched pages are labelled as untrusted data in the tool output, to reduce the chance that instructions hidden in a web page are followed (prompt injection). This is a mitigation, not a guarantee.
- **Secrets.** Keys live in environment variables (`.env.local` locally, Vercel settings in production) and are git-ignored.
- **Tool permissions.** In Claude, read-only tools can be set to always allow, while tools that write data, delete data or spend quota stay on "needs approval".

### Tested behaviour of the URL guard

Run with `npx tsx scripts/test-fetch.ts`:

| Input | Result |
|---|---|
| `https://example.com` | Allowed, page text returned |
| `http://127.0.0.1`, `http://[::1]/`, `http://10.0.0.1` | Refused: address not allowed |
| `http://169.254.169.254/latest/meta-data/` | Refused: address not allowed |
| `http://localhost:3000`, `http://example.com:8080` | Refused: only standard web ports |
| `file:///etc/passwd` | Refused: only http and https |
| `https://user:pass@example.com` | Refused: credentials not allowed |
| `https://example.com/this-page-does-not-exist` | Refused: HTTP 404 reported cleanly |

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **mcp-handler** and **@modelcontextprotocol/sdk** for the MCP server
- **Clerk** for OAuth (`@clerk/nextjs`, `@clerk/mcp-tools`)
- **Neon** serverless Postgres (`@neondatabase/serverless`)
- **Tavily** for web search
- **Zod** for tool input validation
- **Vercel** for hosting

## Project structure

```
app/
  [transport]/route.ts                          MCP server (all tools) behind OAuth
  .well-known/
    oauth-protected-resource/mcp/route.ts       OAuth resource metadata
    oauth-authorization-server/route.ts         OAuth server metadata
  layout.tsx                                    ClerkProvider
lib/
  db.ts                                         Neon client and status list
  search.ts                                     Tavily search with per-user daily limit
  fetchpage.ts                                  Guarded page fetcher
proxy.ts                                        Clerk middleware
scripts/test-fetch.ts                           URL guard checks
```

## Setup

### 1. Clone and install

```bash
git clone    https://github.com/daggubatibhargavi/job-hunt-copilot.git
cd job-hunt-copilot
npm install
```

### 2. Create the database (Neon)

Run this in the Neon SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_user_idx ON applications (user_id);

CREATE TABLE IF NOT EXISTS search_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_log_user_idx ON search_log (user_id, created_at);

CREATE TABLE IF NOT EXISTS resumes (
  user_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3. Configure Clerk

1. Create a Clerk application (Consumer type) and copy the publishable and secret keys.
2. In **OAuth applications → Settings → Client onboarding**, turn **Publish DCR support** on and **Publish CIMD support** off. (CIMD is a beta feature in Clerk, and with it enabled Claude failed to resolve its client document during testing.)
3. Under allowed and default scopes for dynamic clients, include `openid`, `profile` and `email`.

### 4. Environment variables

Create `.env.local` (never commit it):

```
DATABASE_URL=postgresql://...
TAVILY_API_KEY=tvly-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Add the same four variables in your Vercel project settings. Mark the secret ones as Secret.

### 5. Run and deploy

```bash
npm run dev      # local
npm run build    # type-check and production build
```

Push to GitHub and import the repo in Vercel.

### 6. Connect to Claude

1. In Claude, go to **Settings → Connectors → Add custom connector**.
2. Name: `Job Hunt Copilot`. URL: `https://job-hunt-copilot-three.vercel.app/mcp`.
3. Choose **Sign in**, click **Connect**, and sign in through Clerk.
4. Start a chat with the connector enabled.

Quick check that the lock works (should print `401`):

```powershell
try {
  Invoke-RestMethod -Uri https://job-hunt-copilot-three.vercel.app/mcp -Method Post -ContentType "application/json" -Headers @{Accept="application/json, text/event-stream"} -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
} catch { $_.Exception.Response.StatusCode.value__ }
```

## Known limitations

- **DNS rebinding.** The URL guard checks the resolved address before the request. A hostile DNS server could in theory return a different address between the check and the fetch. Pinning the resolved address for the connection would close this gap.
- **Prompt injection is mitigated, not solved.** Labelling untrusted content helps, but a model can still be influenced by text in a web page.
- **Job sites may block readers.** Large boards often block automated requests or render with JavaScript, so `fetch_job_page` can return little or no text. Search snippets also frequently lack posting dates.
- **Clerk development instance.** The project uses Clerk's development keys. A public production launch would need a production instance on a domain you own.
- **DCR is marked deprecated by Clerk.** It works today, and CIMD is the intended replacement once it is generally available for your account.
- **Shared id counter.** Application ids come from one shared sequence, so a single user's ids are not consecutive. Isolation is enforced by `user_id`, not by the id.
- **Free-tier limits** apply to Vercel, Neon, Clerk and Tavily. Check each provider's current limits before relying on them.

## Roadmap

- Pin resolved addresses in the fetcher to close the DNS rebinding gap
- Production Clerk instance
- Cover-letter generation from a saved job and resume
- Reminder tool for applications that need a follow-up

## License

MIT
