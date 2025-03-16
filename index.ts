import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./src/tools/index.js";
import { z } from "zod";
import type { ZodRawShape } from "zod";
import supabase from "./src/lib/supabase-client.js";

// Define message types
interface SystemMessage {
  type: 'system_message';
  content: Array<{
    type: string;
    text: string;
  }>;
}

// Create logger function to ensure proper JSON formatting
function logMessage(level: 'info' | 'error', message: string, data?: any) {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };
  console.error(JSON.stringify(logData));
}

// Create the MCP server with proper message handling
const server = new McpServer({
  name: "Taskflow",
  version: "1.0.0",
  // Add custom message handler
  async onMessage(message: SystemMessage | unknown) {
    // Handle system messages
    if (typeof message === 'object' && message !== null && 'type' in message && message.type === 'system_message') {
      return {
        jsonrpc: "2.0",
        result: {
          type: "success",
          content: (message as SystemMessage).content
        }
      };
    }
    return null; // Let default handler process other messages
  }
});

// Register all tools
registerTools(server);

// Set up STDIO transport and connect
const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    logMessage('info', 'TaskFlow MCP Server running on stdio');
  })
  .catch((error) => {
    logMessage('error', 'Error starting server', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }); 