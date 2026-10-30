import { Newsreader } from "next/font/google";

const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const MCP_URL = "https://job-hunt-copilot-three.vercel.app/mcp";
const REPO_URL = "https://github.com/daggubatibhargavi/job-hunt-copilot";

const mark =
  "rounded bg-[#FFE066] px-1.5 py-0.5 font-mono text-[0.85em] text-[#0F1B2D]";
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F1B2D] dark:focus-visible:outline-[#FFE066]";
const muted = "text-[#52606D] dark:text-[#9FB0C0]";
const codeBox =
  "block select-all overflow-x-auto whitespace-pre-wrap rounded-md bg-[#E8EDF2] px-4 py-3 font-mono text-sm dark:bg-[#162231]";

const steps = [
  { name: "search_jobs", does: "Searches the web for postings" },
  { name: "fetch_job_page", does: "Reads the full posting" },
  { name: "save_application", does: "Adds it to my tracker" },
  { name: "get_resume", does: "Loads my saved resume" },
];

const groups = [
  {
    title: "Find jobs",
    body: "Search by role, place and recency, then read the full posting instead of a snippet.",
    tools: "search_jobs, fetch_job_page",
  },
  {
    title: "Keep track",
    body: "Save jobs with a link and notes, move them from saved to applied to offer, edit or delete them.",
    tools:
      "save_application, list_applications, update_application, update_application_status, delete_application",
  },
  {
    title: "Tailor my resume",
    body: "Store the resume once. Claude reorders and rewords it for each job and is told not to invent skills.",
    tools: "save_resume, get_resume",
  },
];

const connect = [
  "In Claude, open Settings, then Connectors, then Add custom connector.",
  "Name it Job Hunt Copilot and paste the address above.",
  "Choose sign in, click Connect, and create your own account on the page that opens.",
  "Start a new chat, click the plus button, open Connectors, and turn Job Hunt Copilot on.",
];

const prompts = [
  {
    label: "Save your resume",
    text: "Save this as my resume: (paste your resume text here)",
    note: "Leave out your address, phone number and ID numbers.",
  },
  {
    label: "Find jobs",
    text: "Find UI developer jobs for freshers in Hyderabad this month.",
    note: "Change the role, place and time to match what you want.",
  },
  {
    label: "Save the best ones",
    text: "Save the two best ones to my tracker, with their links.",
  },
  { label: "See your tracker", text: "List my applications." },
  {
    label: "Tailor your resume",
    text: "Tailor my resume to application 1. Only reword and reorder what is already there.",
    note: "Use the number Claude shows in your list. Your stored resume stays unchanged.",
  },
  {
    label: "Update a status",
    text: "Mark application 1 as applied.",
    note: "The statuses are saved, applied, interview, offer and rejected.",
  },
];

const decisions = [
  {
    title: "Sign-in with OAuth",
    body: "Every request carries a token that is verified before any tool runs. Claude registers itself with Clerk. Claude failed with one registration method (CIMD), so I traced the error and switched to the other (DCR).",
  },
  {
    title: "One user cannot read another’s data",
    body: "Every table has a user id. Each query filters on the id from the verified token, never on anything Claude sends, and updates and deletes repeat that check.",
  },
  {
    title: "Reading links safely",
    body: "A server that fetches any link can be pointed at its own network. The fetcher allows only http and https on standard ports, blocks private and cloud-metadata addresses, re-checks every redirect, and caps time and size. A script of ten test cases confirms it.",
  },
  {
    title: "Treating web text as untrusted",
    body: "Search results and fetched pages are labelled as data, not instructions, and web search is limited to 20 searches a day per account.",
  },
  {
    title: "Honest limits",
    body: "DNS rebinding is not fully closed, prompt injection is reduced but not solved, and sign-in runs on a development instance. All of this is written down in the README.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F8FA] text-[#0F1B2D] dark:bg-[#0E1621] dark:text-[#E6EDF3] font-[family-name:var(--font-geist-sans)]">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="max-w-3xl">
          <h1
            className={`${display.className} text-5xl leading-[1.05] tracking-tight sm:text-6xl`}
          >
            I built an MCP server so Claude can run my job search.
          </h1>
          <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${muted}`}>
            Job Hunt Copilot is a personal project: a deployed server that gives
            Claude tools to search postings, read them, track my applications and
            tailor my resume. This page explains what I built, how to use it,
            and the decisions behind it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#try"
              className={`rounded-md bg-[#0F1B2D] px-5 py-3 font-medium text-white hover:bg-[#1B2C44] dark:bg-[#FFE066] dark:text-[#0F1B2D] dark:hover:bg-[#FFD633] ${focus}`}
            >
              How to use it
            </a>
            <a
              href="#decisions"
              className={`rounded-md border border-[#C5CFDA] px-5 py-3 font-medium hover:bg-white dark:border-[#2B3A4B] dark:hover:bg-[#162231] ${focus}`}
            >
              See the decisions
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-md border border-[#C5CFDA] px-5 py-3 font-medium hover:bg-white dark:border-[#2B3A4B] dark:hover:bg-[#162231] ${focus}`}
            >
              Read the code
            </a>
          </div>
        </header>

        <section className="mt-16 max-w-2xl">
          <h2 className={`${display.className} text-3xl`}>Why I built it</h2>
          <p className={`mt-4 leading-relaxed ${muted}`}>
            Claude can search the web, but it does not remember which jobs I
            applied to or keep my resume between chats. The Model Context
            Protocol lets a server offer those abilities as tools. I wanted a
            real server I could use in my own job search, built with the care a
            production service needs: sign-in, private data per user, and safe
            handling of web content.
          </p>
        </section>

        <section
          aria-labelledby="example"
          className="mt-14 rounded-lg border border-[#C5CFDA] bg-white p-6 dark:border-[#2B3A4B] dark:bg-[#121C28] sm:p-8"
        >
          <h2 id="example" className={`text-sm font-medium ${muted}`}>
            Example from a real run
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed">
            <strong className="font-semibold">I asked:</strong> “Find a backend
            internship in India, read the posting, save it, and tailor my resume
            to it.”
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <li
                key={s.name}
                className="flex flex-wrap items-center gap-x-3 gap-y-1"
              >
                <span className={mark}>{s.name}</span>
                <span className={`text-sm ${muted}`}>{s.does}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-2xl leading-relaxed">
            <strong className="font-semibold">Claude replied:</strong> “Saved as
            application 7. I moved Python and PostgreSQL to the front of your
            skills to match the posting. I did not add AWS or Postman, because
            they are not on your resume.”
          </p>
        </section>

        <section className="mt-20">
          <h2 className={`${display.className} text-3xl`}>What it does</h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-3">
            {groups.map((g) => (
              <div
                key={g.title}
                className="border-t-2 border-[#0F1B2D] pt-4 dark:border-[#FFE066]"
              >
                <h3 className={`${display.className} text-2xl`}>{g.title}</h3>
                <p className={`mt-3 leading-relaxed ${muted}`}>{g.body}</p>
                <p className="mt-3 font-mono text-xs leading-relaxed break-words">
                  {g.tools}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="try" className="mt-24 max-w-2xl scroll-mt-8">
          <h2 className={`${display.className} text-3xl`}>How to use it</h2>
          <p className={`mt-4 leading-relaxed ${muted}`}>
            You use it inside a Claude chat. Add this address as a custom
            connector. This is a demo on a development sign-in, so please do not
            store anything sensitive in it.
          </p>
          <code className={`mt-4 ${codeBox}`}>{MCP_URL}</code>

          <h3 className="mt-10 font-semibold">Connect it</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-6 leading-relaxed marker:font-semibold">
            {connect.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>

          <h3 className="mt-10 font-semibold">What to type</h3>
          <p className={`mt-2 leading-relaxed ${muted}`}>
            You do not need to know the tool names. Claude picks the right tool
            from plain English. Click a prompt to select it, then copy it. Claude
            asks for approval before it saves or changes anything. If Claude
            searches the web on its own instead, add “use Job Hunt Copilot to
            search”.
          </p>
          <ol className="mt-5 list-decimal space-y-6 pl-6 marker:font-semibold">
            {prompts.map((p) => (
              <li key={p.label}>
                <span className="font-medium">{p.label}</span>
                <code className={`mt-2 ${codeBox}`}>{p.text}</code>
                {p.note && (
                  <span className={`mt-1 block text-sm ${muted}`}>{p.note}</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section id="decisions" className="mt-24 max-w-3xl scroll-mt-8">
          <h2 className={`${display.className} text-3xl`}>
            Decisions that make it production-minded
          </h2>
          <ul className="mt-8 space-y-6">
            {decisions.map((d) => (
              <li key={d.title}>
                <h3 className="font-semibold">{d.title}</h3>
                <p className={`mt-1 leading-relaxed ${muted}`}>{d.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 max-w-2xl">
          <h2 className={`${display.className} text-3xl`}>Built with</h2>
          <p className={`mt-4 leading-relaxed ${muted}`}>
            Next.js and TypeScript on Vercel, the Model Context Protocol SDK,
            Clerk for OAuth, Neon Postgres, the Tavily search API and Zod for
            input validation.
          </p>
        </section>

        <footer
          className={`mt-24 border-t border-[#C5CFDA] pt-6 text-sm dark:border-[#2B3A4B] ${muted}`}
        >
          Source, setup steps and test results are in the{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-4 ${focus}`}
          >
            GitHub repository
          </a>
          .
        </footer>
      </div>
    </main>
  );
}
