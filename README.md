# STEM Calc MCP

[![npm](https://img.shields.io/npm/v/stem-calc-student-mcp.svg)](https://www.npmjs.com/package/stem-calc-student-mcp)
[![downloads](https://img.shields.io/npm/dm/stem-calc-student-mcp.svg)](https://www.npmjs.com/package/stem-calc-student-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

STEM Calc MCP is a free, open source [MCP](https://modelcontextprotocol.io) server for chemistry and physics homework, published on npm as `stem-calc-student-mcp`. It works out molar mass, balances chemical equations, converts between grams, moles and particles, converts units and rounds an answer to the right number of significant figures. The arithmetic is done by tested code, so you get the same answer every time and not a guess from the model.

Use it with Claude Desktop, Claude Code, Cursor, VS Code, Windsurf and any other app that runs a local MCP server. It runs on your computer and needs no internet, no account and no API key.

## Try these prompts

1. "What is the molar mass of copper sulfate pentahydrate, CuSO4.5H2O?"
2. "Balance this equation: C3H8 + O2 -> CO2 + H2O"
3. "How many moles are in 36 grams of water?"
4. "Convert 2.5 kilometres to feet, then round it to 3 significant figures."

## Install

You need Node.js 20 or newer. There is nothing else to install.

```bash
npx -y stem-calc-student-mcp
```

### Claude Desktop

Add this to `claude_desktop_config.json`, then restart the app:

```json
{
  "mcpServers": {
    "stem-calc": {
      "command": "npx",
      "args": ["-y", "stem-calc-student-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add stem-calc -- npx -y stem-calc-student-mcp
```

### Cursor

Add the same block as for Claude Desktop to `.cursor/mcp.json`.

### VS Code

VS Code uses a `servers` key, not `mcpServers`. Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "stem-calc": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "stem-calc-student-mcp"]
    }
  }
}
```

## Tools

All five tools are read only. They calculate an answer and never change anything on your computer.

| Tool | What it does | Inputs |
| --- | --- | --- |
| `molar_mass` | Molar mass of a formula in g/mol, with the mass each element adds | `formula`, like `H2O`, `Ca(OH)2` or `CuSO4.5H2O` |
| `balance_equation` | Balances a chemical equation | `equation`, like `H2 + O2 -> H2O` |
| `stoichiometry` | Converts between grams, moles and particles | `value`, `from`, `to` (`grams`, `moles` or `particles`) and `formula`, which grams need |
| `convert_units` | Converts a value from one unit to another | `value`, `from`, `to` |
| `round_sig_figs` | Rounds a number to a number of significant figures | `value`, `sigFigs` |

Every tool also returns its answer as fields next to the text, so an app that reads JSON gets the numbers without picking them out of a sentence.

## What it knows

- **Formulas.** Write each element with a capital first letter. Round brackets and square brackets work, so `Fe2(SO4)3` and `K3[Fe(CN)6]` are fine, and so are hydrates written with a dot, like `CuSO4.5H2O`. It knows 56 common elements, from hydrogen to uranium. A symbol it does not know gets a clear error, never a guess.
- **Units.** Length: `m`, `km`, `cm`, `mm`, `in`, `ft`. Mass: `g`, `kg`, `mg`, `lb`. Time: `s`, `min`, `h`. Volume: `L`, `mL`, `m^3`. Energy: `J`, `kJ`, `cal`, `kcal`. Temperature: `K`, `C`, `F`. It refuses to convert one kind into another, so metres to seconds is an error.
- **What it does not do.** It does not find a limiting reagent, work with charges or isotopes, or balance reactions that have no solution. When it cannot answer, it says so.

## Node version

There are two floors here, and they are not the same number.

| What you are doing | Node.js |
| --- | --- |
| Running the published server | 20 or newer |
| Building and testing a clone | 22.12 or newer, on the 22 and 24 release lines or 26 and later |

The server itself is happy on Node.js 20, and that is what `engines` in package.json says. The test runner wants a newer Node.js, so the development floor lives in `devEngines` in the same file. npm checks `devEngines` before install, run and test, so a clone on Node.js 20 stops with a clear message instead of a strange failure part way through the test suite. The 23 and 25 release lines are left out on purpose, because the test runner does not run on them.

Both numbers live in package.json, and a test in `tests/node-version.test.ts` keeps them in step with the README and with the range the test runner asks for.

## Development

```bash
npm install
npm run build
npm test
```

The tests call the same functions the tools use, and they check the README, llms.txt, glama.json and the package files against the tools in `src/tools.ts`.

## License

MIT
