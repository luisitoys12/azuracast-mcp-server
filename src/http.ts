// Modo HTTP (Render, Railway, Fly.io, etc.)
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { validateEnv, registerTools } from "./tools.js";

validateEnv();

const app = express();
app.use(express.json());

const MCP_TOKEN = process.env.MCP_API_TOKEN ?? "";

// Health check para Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "azuracast-mcp" });
});

// Endpoint MCP principal
app.all("/mcp", async (req, res) => {
  // Verificar token si está configurado
  if (MCP_TOKEN) {
    const auth = req.headers["authorization"] ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== MCP_TOKEN) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  const server = new McpServer({ name: "azuracast-mcp", version: "1.0.0" });
  registerTools(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = parseInt(process.env.PORT ?? "10000");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[azuracast-mcp] Servidor HTTP corriendo en puerto ${PORT}`);
  console.log(`[azuracast-mcp] MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`[azuracast-mcp] Health check: http://localhost:${PORT}/health`);
});
