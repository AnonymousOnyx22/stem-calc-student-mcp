import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/core/tools.js";
import { tools } from "../src/tools.js";

describe("tool annotations", () => {
  it("tells clients every tool is read only and works offline", () => {
    const configs: any[] = [];
    const server = {
      registerTool: (_name: string, config: any) => {
        configs.push(config);
      },
    } as unknown as McpServer;

    registerTools(server, tools, null);

    expect(configs.length).toBe(tools.length);
    for (const config of configs) expect(config.annotations).toEqual({ readOnlyHint: true, openWorldHint: false });
  });
});
