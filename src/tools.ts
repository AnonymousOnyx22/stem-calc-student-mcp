import { z } from "zod";
import { type ToolDef, bullets } from "./core/tools.js";
import { molarMass, balanceEquation, gramsToMoles, molesToGrams, molesToParticles, convertUnits, roundSigFigs } from "./stem.js";

type Api = null;

export const tools: ToolDef<Api>[] = [
  {
    name: "molar_mass",
    title: "Molar mass",
    description: "Parse a chemical formula and return molar mass with element breakdown.",
    inputSchema: { formula: z.string().describe("Chemical formula like H2O or Ca(OH)2") },
    outputSchema: { mass: z.number(), breakdown: z.array(z.object({ element: z.string(), count: z.number(), mass: z.number() })) },
    run: async (a) => {
      const r = molarMass(a.formula);
      const lines = r.breakdown.map(b => `${b.element}: ${b.count} x ${b.mass/b.count} = ${b.mass}`);
      return { text: `${a.formula}: ${r.mass} g/mol\n${bullets(lines)}`, structured: { mass: r.mass, breakdown: r.breakdown } };
    },
  },
  {
    name: "balance_equation",
    title: "Balance equation",
    description: "Balance a chemical equation written with -> and +.",
    inputSchema: { equation: z.string().describe("Equation like H2 + O2 -> H2O") },
    outputSchema: { balanced: z.string() },
    run: async (a) => {
      const b = balanceEquation(a.equation);
      return { text: b, structured: { balanced: b } };
    },
  },
  {
    name: "stoichiometry",
    title: "Stoichiometry",
    description: "Convert between grams, moles and particles, find limiting reagent.",
    inputSchema: {
      value: z.number(),
      from: z.enum(["grams","moles","particles"]),
      to: z.enum(["grams","moles","particles"]),
      formula: z.string().optional(),
    },
    outputSchema: { result: z.number() },
    run: async (a) => {
      let moles = a.value;
      if (a.from === "grams") moles = gramsToMoles(a.value, a.formula);
      if (a.from === "particles") moles = a.value / 6.02214076e23;
      let result = moles;
      if (a.to === "grams") result = molesToGrams(moles, a.formula);
      if (a.to === "particles") result = molesToParticles(moles);
      return { text: `${a.value} ${a.from} = ${result} ${a.to}`, structured: { result } };
    },
  },
  {
    name: "convert_units",
    title: "Convert units",
    description: "Convert units with dimensional analysis.",
    inputSchema: { value: z.number(), from: z.string(), to: z.string() },
    outputSchema: { result: z.number() },
    run: async (a) => {
      const r = convertUnits(a.value, a.from, a.to);
      return { text: `${a.value} ${a.from} = ${r} ${a.to}`, structured: { result: r } };
    },
  },
  {
    name: "round_sig_figs",
    title: "Round sig figs",
    description: "Apply significant figure rules to a calculation result.",
    inputSchema: { value: z.number(), sigFigs: z.number().int().positive() },
    outputSchema: { result: z.number() },
    run: async (a) => {
      const r = roundSigFigs(a.value, a.sigFigs);
      return { text: `${a.value} -> ${r}`, structured: { result: r } };
    },
  },
];
