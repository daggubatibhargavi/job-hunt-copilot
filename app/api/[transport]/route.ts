import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { sql, STATUSES } from "@/lib/db";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "ping",
      "Check that the Job Hunt Copilot server is working",
      {},
      async () => ({
        content: [{ type: "text", text: "Job Hunt Copilot is alive!" }],
      })
    );

    server.tool(
      "save_application",
      "Save a job to track. Use when the user wants to remember or apply to a job.",
      {
        company: z.string().describe("Company name"),
        role: z.string().describe("Job title"),
        url: z.string().optional().describe("Link to the job posting"),
        notes: z.string().optional().describe("Any notes about this job"),
      },
      async ({ company, role, url, notes }) => {
        const rows = await sql`
          INSERT INTO applications (company, role, url, notes)
          VALUES (${company}, ${role}, ${url ?? null}, ${notes ?? null})
          RETURNING id, company, role, status`;
        return {
          content: [{ type: "text", text: `Saved: ${JSON.stringify(rows[0])}` }],
        };
      }
    );

    server.tool(
      "list_applications",
      "List tracked job applications, optionally filtered by status.",
      {
        status: z.enum(STATUSES).optional().describe("Only show this status"),
      },
      async ({ status }) => {
        const rows = status
          ? await sql`SELECT id, company, role, status, url, notes
                      FROM applications WHERE status = ${status}
                      ORDER BY updated_at DESC`
          : await sql`SELECT id, company, role, status, url, notes
                      FROM applications ORDER BY updated_at DESC`;
        return {
          content: [
            {
              type: "text",
              text: rows.length
                ? JSON.stringify(rows, null, 2)
                : "No applications found.",
            },
          ],
        };
      }
    );

    server.tool(
      "update_application_status",
      "Change the status of a tracked application, using its id.",
      {
        id: z.number().describe("Application id from list_applications"),
        status: z.enum(STATUSES).describe("New status"),
      },
      async ({ id, status }) => {
        const rows = await sql`
          UPDATE applications SET status = ${status}, updated_at = now()
          WHERE id = ${id} RETURNING id, company, role, status`;
        return {
          content: [
            {
              type: "text",
              text: rows.length
                ? `Updated: ${JSON.stringify(rows[0])}`
                : `No application with id ${id}.`,
            },
          ],
        };
      }
    );
  },
  {
    serverInfo: { name: "job-hunt-copilot", version: "1.0.0" },
  },
  { basePath: "/api", verboseLogs: true }
);

export { handler as GET, handler as POST };