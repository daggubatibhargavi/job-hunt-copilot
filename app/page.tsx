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

const steps = [
  { name: "search_jobs", does: "Searches the web for postings" },
  { name: "fetch_job_page", does: "Reads the full posting" },
  { name: "save_application", does: "Adds it to your tracker" },
  { name: "get_resume", does: "Loads your saved resume" },
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
    tools: "save_application, list_applications, update_application, update_application_status, delete_application",
  },
  {
    title: "Tailor your resume",
    body: "Store your resume once. Claude reorders and rewords it for each job and does not invent skills.",
    tools: "save_resume, get_resume",
  },
];

export default function Home() {
  return (
    <main
      className={`min-h-screen bg-[#F6F8FA] text-[#0F1B2D] dark:bg-[#0E1621] dark:text-[#E6EDF3] font-[family-name:var(--font-geist-sans)]`}
    >
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="max-w-3xl">
          <h1
            className={`${display.className} text-5xl leading-[1.05] tracking-tight sm:text-6xl`}
          >
            Your job search, inside Claude.
          </h1>
          <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${muted}`}>
            Job Hunt Copilot is a connector for Claude. It lets Claude search for
            postings, read them, keep your applications in a tracker, and tailor
            your resume to each job.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#connect"
              className={`rounded-md bg-[#0F1B2D] px-5 py-3 font-medium text-white hover:bg-[#1B2C44] dark:bg-[#FFE066] dark:text-[#0F1B2D] dark:hover:bg-[#FFD633] ${focus}`}
            >
              Connect it to Claude
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

        <section
          aria-labelledby="example"
          className="mt-14 rounded-lg border border-[#C5CFDA] bg-white p-6 dark:border-[#2B3A4B] dark:bg-[#121C28] sm:p-8"
        >
          <h2 id="example" className={`text-sm font-medium ${muted}`}>
            Example conversation
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed">
            <strong className="font-semibold">You</strong> asked: “Find a backend
            internship in India, read the posting, save it, and tailor my resume
            to it.”
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.name} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={mark}>{s.name}</span>
                <span className={`text-sm ${muted}`}>{s.does}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-2xl leading-relaxed">
            <strong className="font-semibold">Claude</strong> replied: “Saved as
            application 7. I moved Python and SQL to the top of your skills to
            match the posting. I did not add AWS or Postman, because they are
            not on your resume.”
          </p>
        </section>

        <section className="mt-20 grid gap-10 sm:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="border-t-2 border-[#0F1B2D] pt-4 dark:border-[#FFE066]">
              <h2 className={`${display.className} text-2xl`}>{g.title}</h2>
              <p className={`mt-3 leading-relaxed ${muted}`}>{g.body}</p>
              <p className="mt-3 font-mono text-xs leading-relaxed break-words">
                {g.tools}
              </p>
            </div>
          ))}
        </section>

        <section id="connect" className="mt-24 max-w-2xl scroll-mt-8">
          <h2 className={`${display.className} text-3xl`}>Connect it to Claude</h2>
          <ol className="mt-6 list-decimal space-y-4 pl-6 leading-relaxed marker:font-semibold">
            <li>
              In Claude, open Settings, then Connectors, then Add custom
              connector.
            </li>
            <li>
              Name it Job Hunt Copilot and paste this address:
              <code className="mt-2 block select-all overflow-x-auto rounded-md bg-[#E8EDF2] px-4 py-3 font-mono text-sm dark:bg-[#162231]">
                {MCP_URL}
              </code>
            </li>
            <li>
              Choose sign in, click Connect, and sign in on the page that opens.
              Then turn the connector on in a new chat.
            </li>
          </ol>
        </section>

        <section className="mt-20 max-w-2xl">
          <h2 className={`${display.className} text-3xl`}>What happens to your data</h2>
          <ul className={`mt-6 list-disc space-y-3 pl-6 leading-relaxed`}>
            <li>You must sign in. Requests without a valid sign-in are rejected.</li>
            <li>Each account sees only its own applications and resume.</li>
            <li>
              Link reading refuses internal and private addresses, and web search
              is limited to 20 searches per day per account.
            </li>
            <li className={muted}>
              This is a demo project running on a development sign-in. Please do
              not store anything sensitive in it.
            </li>
          </ul>
        </section>

        <footer className={`mt-24 border-t border-[#C5CFDA] pt-6 text-sm dark:border-[#2B3A4B] ${muted}`}>
          Built with Next.js, Clerk, Neon Postgres and the Model Context
          Protocol.{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-4 ${focus}`}
          >
            Source on GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
