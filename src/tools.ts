import { z } from "zod";
import { type ToolDef, bullets } from "./core/tools.js";
import { ATOMS, molarMass, balanceEquation, gramsToMoles, molesToGrams, molesToParticles, convertUnits, roundSigFigs, empiricalFormula, percentComposition, molarity, dilution, limitingReagent, idealGasLaw } from "./stem.js";

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
    description: "Convert a value between units of length, mass, time, volume, energy, temperature, pressure, speed or flow rate. Common spellings like ml, degC, °C and L/min are accepted. It refuses to convert one kind of unit into another.",
    inputSchema: {
      value: z.number().describe("The number to convert."),
      from: z.string().describe("The unit it is in, like km, kg, mL, J, C, atm, km/h or L/min."),
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
  {
    name: "empirical_formula",
    title: "Empirical formula",
    description: "Find the simplest whole number formula from mass composition. Pass each element's mass or its percent of the total.",
    inputSchema: {
      composition: z.record(z.string(), z.number()).describe("Each element's mass or its percent of the total, like {C: 40.0, H: 6.7, O: 53.3}."),
      unit: z.enum(["percent", "mass"]).optional().describe("Whether the numbers are percentages or masses. Defaults to percent."),
    },
    outputSchema: { formula: z.string(), counts: z.record(z.string(), z.number()) },
    run: async (a) => {
      const r = empiricalFormula(a.composition, a.unit ?? "percent");
      const lines = Object.entries(r.counts).map(([el, c]) => `${el}: ${c}`);
      return { text: `Empirical formula: ${r.formula}\n${bullets(lines)}`, structured: { formula: r.formula, counts: r.counts } };
    },
  },
  {
    name: "percent_composition",
    title: "Percent composition",
    description: "Find the percent by mass of each element in a chemical formula, along with the molar mass. This is the reverse of empirical_formula.",
    inputSchema: { formula: z.string().describe("Chemical formula like H2O, Ca(OH)2 or CuSO4.5H2O. Write each element with a capital first letter.") },
    outputSchema: { mass: z.number(), elements: z.array(z.object({ element: z.string(), count: z.number(), mass: z.number(), percent: z.number() })) },
    run: async (a) => {
      const r = percentComposition(a.formula);
      const lines = r.elements.map((e) => `${e.element}: ${e.percent}% (${e.mass} g/mol)`);
      return { text: `${a.formula}: ${r.mass} g/mol\n${bullets(lines)}`, structured: { mass: r.mass, elements: r.elements } };
    },
  },
  {
    name: "solution_math",
    title: "Solution math",
    description: "Solve molarity (M = mol/L) or a dilution (M1V1 = M2V2). Leave out the one value you want and it is solved. Volumes are in liters.",
    inputSchema: {
      mode: z.enum(["molarity", "dilution"]).describe("molarity solves M = mol/L. dilution solves M1V1 = M2V2."),
      moles: z.number().optional().describe("Moles of solute. Molarity mode only."),
      liters: z.number().optional().describe("Volume of the solution in liters. Molarity mode only."),
      molarity: z.number().optional().describe("Concentration in mol/L. Molarity mode only."),
      initialMolarity: z.number().optional().describe("Starting concentration M1 in mol/L. Dilution mode only."),
      initialLiters: z.number().optional().describe("Starting volume V1 in liters. Dilution mode only."),
      finalMolarity: z.number().optional().describe("Final concentration M2 in mol/L. Dilution mode only."),
      finalLiters: z.number().optional().describe("Final volume V2 in liters. Dilution mode only."),
    },
    outputSchema: { solved: z.string(), result: z.number() },
    run: async (a) => {
      if (a.mode === "molarity") {
        const r = molarity(a);
        return { text: `${r.moles} mol in ${r.liters} L = ${r.molarity} M\nSolved for ${r.solved}.`, structured: { solved: r.solved, result: r[r.solved] } };
      }
      const r = dilution(a);
      return { text: `${r.initialMolarity} M x ${r.initialLiters} L = ${r.finalMolarity} M x ${r.finalLiters} L\nSolved for ${r.solved}.`, structured: { solved: r.solved, result: r[r.solved] } };
    },
  },
  {
    name: "limiting_reagent",
    title: "Limiting reagent",
    description: "Find the limiting reagent and theoretical yield for a reaction. Pass the unbalanced or balanced equation and the grams of every reactant. It balances the equation first, then reports the limiting reagent, the theoretical yield of a product in grams and moles, and the grams left over of each excess reactant.",
    inputSchema: {
      equation: z.string().describe("The reaction, like N2 + H2 -> NH3."),
      reactants: z.array(z.object({ formula: z.string().describe("A reactant formula exactly as written in the equation."), grams: z.number().describe("Grams of that reactant.") })).describe("The grams available of every reactant."),
      product: z.string().optional().describe("The product to report the yield for, written as in the equation. Defaults to the first product."),
    },
    outputSchema: { balanced: z.string(), limiting: z.string(), product: z.string(), theoreticalYieldGrams: z.number(), theoreticalYieldMoles: z.number() },
    run: async (a) => {
      const r = limitingReagent(a.equation, a.reactants, a.product);
      const lines = r.leftover.map((x) => `${x.formula}: ${x.leftoverGrams} g left over`);
      return {
        text: `${r.balanced}\nLimiting reagent: ${r.limiting}\nTheoretical yield of ${r.product}: ${r.theoreticalYieldGrams} g (${r.theoreticalYieldMoles} mol)${lines.length ? "\n" + bullets(lines) : ""}`,
        structured: { balanced: r.balanced, limiting: r.limiting, product: r.product, theoreticalYieldGrams: r.theoreticalYieldGrams, theoreticalYieldMoles: r.theoreticalYieldMoles },
      };
    },
  },
  {
    name: "ideal_gas_law",
    title: "Ideal gas law",
    description: "Solve the ideal gas law PV = nRT for the one value you leave out. Pressure is in atm or kPa, volume in liters, temperature in kelvin and amount in moles. The answer comes back in the same pressure unit you used.",
    inputSchema: {
      pressure: z.number().optional().describe("Pressure of the gas, in the unit given by pressureUnit."),
      pressureUnit: z.enum(["atm", "kPa"]).optional().describe("Unit for pressure, atm or kPa. Defaults to atm."),
      liters: z.number().optional().describe("Volume of the gas in liters (L)."),
      moles: z.number().optional().describe("Amount of gas in moles."),
      kelvin: z.number().optional().describe("Temperature in kelvin (K). Convert from Celsius first by adding 273.15."),
    },
    outputSchema: { solved: z.string(), pressure: z.number(), pressureUnit: z.string(), liters: z.number(), moles: z.number(), kelvin: z.number() },
    run: async (a) => {
      const unit = a.pressureUnit ?? "atm";
      const perAtm = unit === "kPa" ? 101.325 : 1;
      const r = idealGasLaw({ pressureAtm: a.pressure === undefined ? undefined : a.pressure / perAtm, liters: a.liters, moles: a.moles, kelvin: a.kelvin });
      const pressure = r.solved === "pressureAtm" ? roundSigFigs(r.pressureAtm * perAtm, 6) : a.pressure!;
      const solved = r.solved === "pressureAtm" ? "pressure" : r.solved;
      return {
        text: `${pressure} ${unit} x ${r.liters} L = ${r.moles} mol x R x ${r.kelvin} K\nSolved for ${solved}.`,
        structured: { solved, pressure, pressureUnit: unit, liters: r.liters, moles: r.moles, kelvin: r.kelvin },
      };
    },
  },
];
