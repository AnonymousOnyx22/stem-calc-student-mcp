import { z } from "zod";
import { type ToolDef, bullets } from "./core/tools.js";
import { ATOMS, molarMass, balanceEquation, gramsToMoles, molesToGrams, molesToParticles, convertUnits, roundSigFigs } from "./stem.js";

type Api = null;

export const tools: ToolDef<Api>[] = [
  {
    name: "molar_mass",
    title: "Molar mass",
    description: "Parse a chemical formula and return the molar mass in g/mol with the mass each element adds. Handles brackets and hydrates like CuSO4.5H2O.",
    inputSchema: { formula: z.string().describe("Chemical formula like H2O, Ca(OH)2 or CuSO4.5H2O. Write each element with a capital first letter.") },
    outputSchema: { mass: z.number(), breakdown: z.array(z.object({ element: z.string(), count: z.number(), mass: z.number() })) },
    run: async (a) => {
      const r = molarMass(a.formula);
      const lines = r.breakdown.map((b) => `${b.element}: ${b.count} x ${ATOMS[b.element]} = ${b.mass}`);
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
    description: "Convert between grams, moles and particles. The formula is required whenever grams are the from or to unit. Converting between moles and particles needs no formula.",
    inputSchema: {
      value: z.number().describe("The amount to convert."),
      from: z.enum(["grams", "moles", "particles"]).describe("What the value is in."),
      to: z.enum(["grams", "moles", "particles"]).describe("What to convert it to."),
      formula: z.string().optional().describe("The chemical formula, like H2O. Required when from or to is grams. Not used otherwise."),
    },
    outputSchema: { result: z.number() },
    run: async (a) => {
      if ((a.from === "grams" || a.to === "grams") && !a.formula) throw new Error("Pass the chemical formula, like H2O, to convert to or from grams.");
      let moles = a.value;
      if (a.from === "grams") moles = gramsToMoles(a.value, a.formula!);
      if (a.from === "particles") moles = a.value / 6.02214076e23;
      let result = moles;
      if (a.to === "grams") result = molesToGrams(moles, a.formula!);
      if (a.to === "particles") result = molesToParticles(moles);
      return { text: `${a.value} ${a.from} = ${result} ${a.to}`, structured: { result } };
    },
  },
  {
    name: "convert_units",
    title: "Convert units",
    description: "Convert a value between units of length, mass, time, volume, energy or temperature. It refuses to convert one kind of unit into another.",
    inputSchema: {
      value: z.number().describe("The number to convert."),
      from: z.string().describe("The unit it is in, like km, kg, mL, J or C."),
      to: z.string().describe("The unit to convert it to."),
    },
    outputSchema: { result: z.number() },
    run: async (a) => {
      const r = convertUnits(a.value, a.from, a.to);
      return { text: `${a.value} ${a.from} = ${r} ${a.to}`, structured: { result: r } };
    },
  },
  {
    name: "round_sig_figs",
    title: "Round sig figs",
    description: "Round a number to a given number of significant figures.",
    inputSchema: {
      value: z.number().describe("The number to round."),
      sigFigs: z.number().int().positive().describe("How many significant figures to keep."),
    },
    outputSchema: { result: z.number() },
    run: async (a) => {
      const r = roundSigFigs(a.value, a.sigFigs);
      return { text: `${a.value} -> ${r}`, structured: { result: r } };
    },
  },
];
