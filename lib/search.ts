
import { sql } from "@/lib/db";

const DAILY_LIMIT = 20;

export async function tavilySearch(
  userId: string,
  query: string,
  maxResults: number,
  timeRange?: string
) {
  const used = await sql`
    SELECT count(*)::int AS n FROM search_log
    WHERE user_id = ${userId} AND created_at > now() - interval '1 day'`;
  if (used[0].n >= DAILY_LIMIT) {
    throw new Error("Daily search limit reached. Try again tomorrow.");
  }
  await sql`INSERT INTO search_log (user_id, query) VALUES (${userId}, ${query})`;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
      ...(timeRange ? { time_range: timeRange } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Search failed (HTTP ${res.status})`);
  const data = await res.json();
  return data.results as { title: string; url: string; content: string }[];
}