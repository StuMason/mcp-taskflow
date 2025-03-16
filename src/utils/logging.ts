import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

let mcpServer: McpServer | null = null;

export function initializeLogger(server: McpServer) {
  mcpServer = server;
}

export function logMessage(level: 'info' | 'error' | 'debug' | 'warn', message: string, data?: any) {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };
  console.error(JSON.stringify(logData));
} 