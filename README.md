# STEM Calc MCP

[![npm](https://img.shields.io/npm/v/stem-calc-student-mcp.svg)](https://www.npmjs.com/package/stem-calc-student-mcp)
[![downloads](https://img.shields.io/npm/dm/stem-calc-student-mcp.svg)](https://www.npmjs.com/package/stem-calc-student-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

When an AI guesses chemistry and physics homework, the numbers are often wrong. STEM Calc MCP fixes that: it is a free, open source [MCP](https://modelcontextprotocol.io) server that does the arithmetic with tested code, so you get the same answer every time. It works out molar mass, balances chemical equations, converts between grams, moles and particles, converts units and rounds to the right number of significant figures.

Install with one line:

```bash
npx -y stem-calc-student-mcp
```

Try these prompts:

1. "What is the molar mass of copper sulfate pentahydrate, CuSO4.5H2O?"
2. "Balance this equation: C3H8 + O2 -> CO2 + H2O"
3. "How many moles are in 36 grams of water?"

Use it with Claude Desktop, Claude Code, Cursor, VS Code, Windsurf and any other app that runs a local MCP server. It runs on your computer and needs no internet, no account and no API key.

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

| Tool | What it does | Inputs | Example prompt |
| --- | --- | --- | --- |
| `molar_mass` | Molar mass of a formula in g/mol, with the mass each element adds | `formula`, like `H2O`, `Ca(OH)2` or `CuSO4.5H2O` | "What is the molar mass of Ca(OH)2?" |
| `balance_equation` | Balances a chemical equation | `equation`, like `H2 + O2 -> H2O` | "Balance C3H8 + O2 -> CO2 + H2O." |
| `stoichiometry` | Converts between grams, moles and particles | `value`, `from`, `to` (`grams`, `moles` or `particles`) and `formula`, which grams need | "How many moles are in 36 grams of water?" |
| `convert_units` | Converts a value from one unit to another | `value`, `from`, `to` | "Convert 2.5 km to feet." |
| `round_sig_figs` | Rounds a number to a number of significant figures | `value`, `sigFigs` | "Round 123456 to 3 significant figures." |

Every tool also returns its answer as fields next to the text, so an app that reads JSON gets the numbers without picking them out of a sentence.

## What it knows

- **Formulas.** Write each element with a capital first letter. Round brackets and square brackets work, so `Fe2(SO4)3` and `K3[Fe(CN)6]` are fine, and so are hydrates written with a dot, like `CuSO4.5H2O`. It knows 56 common elements, from hydrogen to uranium. A symbol it does not know gets a clear error, never a guess.
  - `Fe2(SO4)3` has 2 iron, 3 sulfur and 12 oxygen atoms, and a molar mass of 399.858 g/mol.
  - `K3[Fe(CN)6]` has 3 potassium, 1 iron, 6 carbon and 6 nitrogen atoms, and a molar mass of 329.247 g/mol.
  - `CuSO4.5H2O` counts the five waters, so it has 1 copper, 1 sulfur, 9 oxygen and 10 hydrogen atoms, and a molar mass of 249.677 g/mol.
- **Units.** Length: `m`, `km`, `cm`, `mm`, `in`, `ft`. Mass: `g`, `kg`, `mg`, `lb`. Time: `s`, `min`, `h`. Volume: `L`, `mL`, `m^3`. Energy: `J`, `kJ`, `cal`, `kcal`. Temperature: `K`, `C`, `F`. It refuses to convert one kind into another, so metres to seconds is an error.
- **What it does not do.** It does not find a limiting reagent, work with charges or isotopes, or balance reactions that have no solution. When it cannot answer, it says so.

## How it compares

Some MCP servers connect an assistant to a learning management system, so it can read your courses, grades and due dates. Those need an account, a login and a network connection. This one does none of that. It only does homework math, and it runs on your own computer with no sign in, no network calls and no files read or written. The same input gives the same answer every time.

Use an LMS server to find out what is due. Use this one to check the chemistry and unit conversions once you sit down to do it. They work fine side by side.

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

## More free student MCP servers

All free, open source and read only where they touch your accounts. Browse the full list at [brightspacemcp.com/more-mcps](https://brightspacemcp.com/more-mcps/).

| Server | What it does |
| --- | --- |
| [Brightspace MCP](https://github.com/AnonymousOnyx22/brightspace-d2l-mcp) | D2L Brightspace for AI. Due dates with real submission status, grades, a target grade calculator and course files. |
| [Canvas MCP](https://github.com/AnonymousOnyx22/canvas-lms-student-mcp) | Canvas LMS for AI, read only. Due dates, missing work, grades and announcements. |
| [Moodle MCP](https://github.com/AnonymousOnyx22/moodle-student-mcp) | Moodle for AI, read only. Due dates, overdue work, grades and announcements. |
| [Google Classroom MCP](https://github.com/AnonymousOnyx22/google-classroom-student-mcp) | Google Classroom for AI, read only. Todos, due dates, missing work and grades. |
| [GPA Calculator MCP](https://github.com/AnonymousOnyx22/gpa-calculator-mcp) | GPA, grade conversion and the grade you need on the final, for AI. Works offline, no account. |
| [Citations MCP](https://github.com/AnonymousOnyx22/student-citations-mcp) | APA, MLA and Chicago citations from a DOI, an ISBN or typed details. No account. |
| [Study Planner MCP](https://github.com/AnonymousOnyx22/study-planner-mcp) | Exam study schedules, spaced repetition dates, pomodoro plans and assignment milestones. Works offline. |
| [Paper Finder MCP](https://github.com/AnonymousOnyx22/paper-finder-student-mcp) | Search scholarly papers, find open access copies and related work through OpenAlex. No key needed. |
| [BibTeX Reference Manager MCP](https://github.com/AnonymousOnyx22/bibtex-reference-manager-mcp) | Clean, convert, dedupe and lint BibTeX, RIS and CSL JSON reference lists, and make cite keys. Works offline. |
| [Open Textbook Finder MCP](https://github.com/AnonymousOnyx22/open-textbook-finder-mcp) | Find free legal copies of textbooks on OpenStax, DOAB and Open Library, look up editions by ISBN and suggest cheaper older ones. |
| [Essay Stats MCP](https://github.com/AnonymousOnyx22/essay-stats-mcp) | Offline writing metrics for essays. Word and page counts, readability scores, passive voice, repeated openers, filler words, long sentences and word limit checks, so students can check their work against assignment requirements. No account, no network. |
| [Syllabus to Calendar MCP](https://github.com/AnonymousOnyx22/syllabus-calendar-mcp) | Syllabus to calendar MCP server. Extract dates from syllabus text, build an ics calendar, expand recurring classes and merge calendars. Works offline, no account. |
| [Job Application Tracker MCP](https://github.com/AnonymousOnyx22/job-tracker-student-mcp) | Job application tracker MCP server. Track internships, jobs, interviews and deadlines offline, see what is coming up, and export your list as CSV or Markdown. No account and no API keys. |

## License

MIT
