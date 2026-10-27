
import { createMcpHandler } from "mcp-handler";

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
  },
  {
    serverInfo: { name: "job-hunt-copilot", version: "1.0.0" },
  },
  { basePath: "/api", verboseLogs: true }
);

export { handler as GET, handler as POST };