#!/usr/bin/env node
// Modo stdio (local: Claude Desktop, Cursor, etc.)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateEnv, registerTools } from "./tools.js";

validateEnv();

const server = new McpServer({ name: "azuracast-mcp", version: "1.0.0" });
registerTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[azuracast-mcp] Servidor stdio iniciado");
