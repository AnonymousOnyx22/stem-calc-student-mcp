import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { tools } from "../src/tools.js";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const readJson = (path: string) => JSON.parse(read(path));
const ID = "stem-calc-student-mcp";

describe("package and registry metadata", () => {
  it("names this server everywhere, not the template it was made from", () => {
    const pkg = readJson("package.json"), server = readJson("server.json"), glama = readJson("glama.json");
    expect(pkg.name).toBe(ID);
    expect(pkg.mcpName).toBe(`io.github.AnonymousOnyx22/${ID}`);
    expect(server.name).toBe(pkg.mcpName);
    expect(server.packages[0].identifier).toBe(ID);
    expect(server.repository.url).toMatch(new RegExp(`/${ID}$`));
    expect(glama.name).toBe(ID);
    expect(glama.repository.url).toMatch(new RegExp(`/${ID}$`));
    expect(server.version).toBe(pkg.version);
    expect(glama.version).toBe(pkg.version);
  });
  it("keeps every description readable and the registry one under its limit", () => {
    const server = readJson("server.json");
    expect(server.description.length).toBeLessThanOrEqual(100);
    for (const file of ["package.json", "server.json", "glama.json"]) expect(readJson(file).description, file).toMatch(/^[A-Z]/);
  });
  it("keeps search keywords for what students look for", () => {
    const keywords = readJson("package.json").keywords.map((k: string) => k.toLowerCase());
    for (const term of ["molar mass", "stoichiometry", "significant figures", "unit conversion", "equation balancing"]) expect(keywords, term).toContain(term);
    expect(keywords.length).toBeGreaterThanOrEqual(10);
  });
  it("leaves no template text behind", () => {
    // the table of sibling servers names the other servers on purpose, so it is left out of this check
    for (const file of ["README.md", "llms.txt", "glama.json", "server.json", "CHANGELOG.md"]) expect(read(file).replace(/\n## More free student MCP servers[\s\S]*?(?=\n## |$)/, ""), file).not.toMatch(/gpa|chatgpt/i);
  });
});

describe("docs match the tools", () => {
  it("lists every tool in glama.json, in the same order, with the same description", () => {
    const glama = readJson("glama.json");
    expect(glama.tools.map((t: any) => t.name)).toEqual(tools.map((t) => t.name));
    for (const tool of tools) expect(glama.tools.find((t: any) => t.name === tool.name).description).toBe(tool.description);
  });
  it("lists every input of every tool in glama.json", () => {
    const glama = readJson("glama.json");
    for (const tool of tools) {
      const listed = glama.tools.find((t: any) => t.name === tool.name).parameters.map((p: any) => p.name);
      expect(listed.sort(), tool.name).toEqual(Object.keys(tool.inputSchema).sort());
    }
  });
  it("names every tool in the README and llms.txt, with its description in llms.txt", () => {
    const readme = read("README.md"), llms = read("llms.txt");
    for (const tool of tools) {
      expect(readme, `README ${tool.name}`).toContain(`\`${tool.name}\``);
      expect(llms, `llms.txt ${tool.name}`).toContain(`${tool.name}: ${tool.description}`);
    }
  });
  it("says how many tools there are, and the number is right", () => {
    const words = ["", "one", "two", "three", "four", "five", "six", "seven", "eight"];
    expect(read("README.md")).toContain(`All ${words[tools.length]} tools are read only`);
    expect(read("llms.txt")).toContain(`All ${words[tools.length]} tools are read only`);
  });
  it("gives every tool an example prompt in llms.txt", () => {
    expect(read("llms.txt").match(/Example prompt:/g)?.length).toBe(tools.length);
  });
});
