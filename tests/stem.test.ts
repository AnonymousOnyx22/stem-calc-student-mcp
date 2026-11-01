import { describe, it, expect } from "vitest";
import { molarMass, parseFormula, balanceEquation, convertUnits, roundSigFigs, gramsToMoles, empiricalFormula, percentComposition, molarity, dilution, limitingReagent, idealGasLaw, kinematics } from "../src/stem.js";
import { tools } from "../src/tools.js";

const tool = (name: string) => tools.find((t) => t.name === name)!;

describe("molar mass", () => {
  it("adds up the atoms of a plain formula", () => {
    expect(molarMass("H2O").mass).toBe(18.015);
    expect(molarMass("C6H12O6").mass).toBe(180.156);
  });
  it("handles brackets and repeated groups without float noise", () => {
    expect(molarMass("Ca(OH)2").mass).toBe(74.092);
    expect(molarMass("Fe2(SO4)3").mass).toBe(399.858);
    expect(molarMass("K3[Fe(CN)6]").mass).toBe(329.247);
  });
  it("counts the water in a hydrate", () => {
    expect(molarMass("CuSO4.5H2O").mass).toBe(249.677);
    expect(molarMass("CuSO4·5H2O").mass).toBe(249.677);
    expect(parseFormula("CuSO4.5H2O")).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });
  it("knows the transition metals students meet", () => {
    for (const f of ["KMnO4", "K2Cr2O7", "NiCl2", "AuCl3", "SnO2", "HgO"]) expect(molarMass(f).mass).toBeGreaterThan(50);
  });
  it("refuses what is not a formula instead of answering zero", () => {
    expect(() => molarMass("h2o")).toThrow(/capital/);
    expect(() => molarMass("")).toThrow(/formula/);
    expect(() => molarMass("H2O!")).toThrow(/not a chemical formula/);
    expect(() => molarMass("CuSO4.")).toThrow(/dot/);
    expect(() => molarMass("Xx2")).toThrow(/Unknown element Xx/);
  });
});

describe("balance_equation", () => {
  it("balances common reactions", () => {
    expect(balanceEquation("H2 + O2 -> H2O")).toBe("2H2 + O2 -> 2H2O");
    expect(balanceEquation("Fe + O2 -> Fe2O3")).toBe("4Fe + 3O2 -> 2Fe2O3");
    expect(balanceEquation("C3H8 + O2 -> CO2 + H2O")).toBe("C3H8 + 5O2 -> 3CO2 + 4H2O");
    expect(balanceEquation("Al + O2 -> Al2O3")).toBe("4Al + 3O2 -> 2Al2O3");
  });
  it("balances reactions with larger coefficients", () => {
    expect(balanceEquation("C6H12O6 + O2 -> CO2 + H2O")).toBe("C6H12O6 + 6O2 -> 6CO2 + 6H2O");
    expect(balanceEquation("KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2")).toBe(
      "2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 8H2O + 5Cl2",
    );
  });
  it("says so when it cannot", () => {
    expect(() => balanceEquation("H2 -> O2")).toThrow(/balance/);
    expect(() => balanceEquation("hello")).toThrow(/->/);
  });
  it("accepts = and unicode arrows", () => {
    expect(balanceEquation("H2 + O2 = H2O")).toBe("2H2 + O2 -> 2H2O");
    expect(balanceEquation("H2 + O2 → H2O")).toBe("2H2 + O2 -> 2H2O");
  });
  it("names the problem in the error", () => {
    expect(() => balanceEquation("H2 -> O2")).toThrow(/H appears only on the reactant side/);
    expect(() => balanceEquation("H2 -> H2O -> O2")).toThrow(/more than one arrow/);
    expect(() => balanceEquation("H2 + -> H2")).toThrow(/stray \+/);
    expect(() => balanceEquation(" -> H2")).toThrow(/reactant side.*empty/);
  });
});

describe("convert_units", () => {
  it("converts within one kind of unit", () => {
    expect(convertUnits(2, "km", "m")).toBe(2000);
    expect(convertUnits(500, "mL", "L")).toBe(0.5);
    expect(convertUnits(100, "C", "F")).toBe(212);
    expect(convertUnits(0, "C", "K")).toBe(273.15);
  });
  it("converts pressure and speed", () => {
    expect(convertUnits(1, "atm", "kPa")).toBeCloseTo(101.325, 6);
    expect(convertUnits(760, "mmHg", "atm")).toBeCloseTo(1, 9);
    expect(convertUnits(1, "bar", "Pa")).toBe(100000);
    expect(convertUnits(14.6959, "psi", "atm")).toBeCloseTo(1, 4);
    expect(convertUnits(36, "km/h", "m/s")).toBeCloseTo(10, 9);
    expect(() => convertUnits(1, "atm", "m/s")).toThrow(/pressure.*speed/);
  });
  it("refuses to convert a length into a time, or a mass into a volume", () => {
    expect(() => convertUnits(1, "m", "s")).toThrow(/length.*time/);
    expect(() => convertUnits(1, "kg", "L")).toThrow(/mass.*volume/);
    expect(() => convertUnits(1, "C", "kg")).toThrow(/temperature.*mass/);
  });
  it("accepts common spellings and flow rates", () => {
    expect(convertUnits(500, "ml", "l")).toBe(0.5);
    expect(convertUnits(100, "°C", "degF")).toBe(212);
    expect(convertUnits(0, "degC", "kelvin")).toBe(273.15);
    expect(convertUnits(60, "L/min", "L/s")).toBeCloseTo(1, 9);
    expect(convertUnits(1000, "mL/min", "lpm")).toBeCloseTo(1, 9);
    expect(() => convertUnits(1, "L/min", "kg")).toThrow(/flow.*mass/);
  });
  it("names a unit it does not know", () => {
    expect(() => convertUnits(1, "parsec", "m")).toThrow(/Unknown unit/);
  });
  it("lists every supported unit by category in the unknown unit error", () => {
    let msg = "";
    try {
      convertUnits(1, "parsec", "m");
    } catch (e) {
      msg = String(e);
    }
    expect(msg).toContain("Unknown unit");
    expect(msg).toContain("- length: m, km, cm, mm, in, ft");
    expect(msg).toContain("- pressure: Pa, kPa, atm, mmHg, bar, psi");
    expect(msg).toContain("- speed: m/s, km/h");
    expect(msg).toContain("- flow: m^3/s, L/s, L/min, mL/min");
  });
});

describe("round_sig_figs", () => {
  it("rounds to the number of significant figures", () => {
    expect(roundSigFigs(123456, 3)).toBe(123000);
    expect(roundSigFigs(0.004567, 2)).toBe(0.0046);
    expect(roundSigFigs(-123456, 2)).toBe(-120000);
  });
  it("copes with zero and refuses what is not a number", () => {
    expect(roundSigFigs(0, 3)).toBe(0);
    expect(() => roundSigFigs(NaN, 3)).toThrow(/number/);
    expect(() => roundSigFigs(5, 0)).toThrow(/> 0/);
  });
});

describe("stoichiometry", () => {
  it("converts grams to moles and back with a formula", async () => {
    expect(gramsToMoles(18.015, "H2O")).toBeCloseTo(1, 6);
    const r: any = await tool("stoichiometry").run({ value: 36.03, from: "grams", to: "moles", formula: "H2O" }, null);
    expect(r.structured.result).toBeCloseTo(2, 6);
  });
  it("converts moles to particles without a formula", async () => {
    const r: any = await tool("stoichiometry").run({ value: 1, from: "moles", to: "particles" }, null);
    expect(r.structured.result).toBeCloseTo(6.02214076e23, -15);
  });
  it("asks for the formula instead of crashing when grams are involved", async () => {
    await expect(tool("stoichiometry").run({ value: 18, from: "grams", to: "moles" }, null)).rejects.toThrow(/formula/);
    await expect(tool("stoichiometry").run({ value: 1, from: "moles", to: "grams" }, null)).rejects.toThrow(/formula/);
  });
  it("does not promise a limiting reagent, which it does not calculate", () => {
    expect(tool("stoichiometry").description).not.toMatch(/limiting/i);
  });
});

describe("empirical_formula", () => {
  it("finds the simplest formula from percent composition", () => {
    expect(empiricalFormula({ C: 40.0, H: 6.7, O: 53.3 }).formula).toBe("CH2O");
    expect(empiricalFormula({ C: 32.45, H: 2.72, O: 64.83 }).formula).toBe("C2H2O3");
    expect(empiricalFormula({ C: 58.80, H: 9.87, O: 31.33 }).formula).toBe("C5H10O2");
    expect(empiricalFormula({ C: 62.04, H: 10.41, O: 27.55 }).formula).toBe("C3H6O");
  });
  it("works with masses instead of percentages", () => {
    expect(empiricalFormula({ C: 2.402, H: 0.403, O: 3.203 }, "mass").formula).toBe("CH2O");
  });
  it("returns the counts it used", () => {
    const r = empiricalFormula({ C: 40.0, H: 6.7, O: 53.3 });
    expect(r.counts).toEqual({ C: 1, H: 2, O: 1 });
  });
  it("uses Hill order in the formula string", () => {
    expect(empiricalFormula({ C: 83.73, N: 16.27 }).formula).toBe("C6N");
    expect(empiricalFormula({ H: 11.19, O: 88.81 }).formula).toBe("H2O");
  });
  it("refuses unknown elements and non positive masses", () => {
    expect(() => empiricalFormula({ Xx: 50 })).toThrow(/Unknown element Xx/);
    expect(() => empiricalFormula({ C: 0, H: 100 })).toThrow(/positive/);
  });
  it("does not promise a molecular formula, which it does not calculate", () => {
    expect(tool("empirical_formula").description).not.toMatch(/molecular formula/i);
  });
});

describe("percent_composition", () => {
  it("gives percent by mass for water", () => {
    const r = percentComposition("H2O");
    expect(r.elements.find((e) => e.element === "H")!.percent).toBeCloseTo(11.19, 2);
    expect(r.elements.find((e) => e.element === "O")!.percent).toBeCloseTo(88.81, 2);
  });
  it("handles brackets and rejects unknown elements", () => {
    expect(percentComposition("Ca(OH)2").elements.find((e) => e.element === "O")!.count).toBe(2);
    expect(() => percentComposition("Xx2")).toThrow();
  });
});

describe("solution_math", () => {
  it("solves molarity for each missing value", () => {
    expect(molarity({ moles: 0.5, liters: 2 }).molarity).toBe(0.25);
    expect(molarity({ molarity: 2, liters: 0.25 }).moles).toBe(0.5);
    expect(molarity({ moles: 1, molarity: 4 }).liters).toBe(0.25);
  });
  it("solves a dilution for each missing value", () => {
    expect(dilution({ initialMolarity: 12, initialLiters: 0.025, finalLiters: 1 }).finalMolarity).toBe(0.3);
    expect(dilution({ initialMolarity: 12, finalMolarity: 0.3, finalLiters: 1 }).initialLiters).toBe(0.025);
  });
  it("needs the right number of values and positive numbers", () => {
    expect(() => molarity({ moles: 1 })).toThrow(/exactly two/);
    expect(() => dilution({ initialMolarity: 1, initialLiters: 1 })).toThrow(/exactly three/);
    expect(() => molarity({ moles: -1, liters: 1 })).toThrow(/positive/);
  });
  it("runs through the tool", async () => {
    const r = await tool("solution_math").run({ mode: "molarity", moles: 1, liters: 2 }, null);
    expect(r.structured).toEqual({ solved: "molarity", result: 0.5 });
  });
});

describe("limiting_reagent", () => {
  it("finds the limiting reagent and yield for ammonia", () => {
    const r = limitingReagent("N2 + H2 -> NH3", [{ formula: "N2", grams: 28.0134 }, { formula: "H2", grams: 3 }]);
    expect(r.balanced).toBe("N2 + 3H2 -> 2NH3");
    expect(r.limiting).toBe("H2");
    expect(r.theoreticalYieldGrams).toBeCloseTo(16.9, 1);
    expect(r.leftover[0].formula).toBe("N2");
    expect(r.leftover[0].leftoverGrams).toBeGreaterThan(0);
  });
  it("can report a named product", () => {
    const r = limitingReagent("H2 + O2 -> H2O", [{ formula: "H2", grams: 4 }, { formula: "O2", grams: 100 }], "H2O");
    expect(r.limiting).toBe("H2");
    expect(r.theoreticalYieldGrams).toBeCloseTo(35.74, 1);
  });
  it("rejects missing or unknown species", () => {
    expect(() => limitingReagent("N2 + H2 -> NH3", [{ formula: "N2", grams: 5 }])).toThrow(/grams of H2/);
    expect(() => limitingReagent("N2 + H2 -> NH3", [{ formula: "N2", grams: 5 }, { formula: "H2", grams: 1 }], "O2")).toThrow(/not a product/);
  });
  it("runs through the tool", async () => {
    const r = await tool("limiting_reagent").run({ equation: "H2 + O2 -> H2O", reactants: [{ formula: "H2", grams: 4 }, { formula: "O2", grams: 100 }] }, null);
    expect(r.structured).toMatchObject({ limiting: "H2", product: "H2O" });
  });
});

describe("idealGasLaw", () => {
  it("solves for volume at 1 atm and 273.15 K", () => {
    const r = idealGasLaw({ pressureAtm: 1, moles: 1, kelvin: 273.15 });
    expect(r.solved).toBe("liters");
    expect(r.liters).toBeCloseTo(22.4141, 3);
  });
  it("solves for pressure, moles and temperature", () => {
    expect(idealGasLaw({ liters: 10, moles: 2, kelvin: 300 }).pressureAtm).toBeCloseTo(4.92344, 4);
    expect(idealGasLaw({ pressureAtm: 2, liters: 5, kelvin: 300 }).moles).toBeCloseTo(0.406208, 4);
    expect(idealGasLaw({ pressureAtm: 1, liters: 22.4141, moles: 1 }).kelvin).toBeCloseTo(273.15, 1);
  });
  it("rejects bad input", () => {
    expect(() => idealGasLaw({ pressureAtm: 1, liters: 1 })).toThrow(/exactly three/);
    expect(() => idealGasLaw({ pressureAtm: -1, liters: 1, moles: 1 })).toThrow(/positive/);
  });
  it("runs through the tool in kPa", async () => {
    const r = await tool("ideal_gas_law").run({ liters: 10, moles: 2, kelvin: 300, pressureUnit: "kPa" }, null);
    expect(r.structured).toMatchObject({ solved: "pressure", pressureUnit: "kPa" });
    expect((r.structured as { pressure: number }).pressure).toBeCloseTo(498.87, 1);
  });
  it("runs through the tool in atm", async () => {
    const r = await tool("ideal_gas_law").run({ pressure: 1, moles: 1, kelvin: 273.15 }, null);
    expect((r.structured as { liters: number }).liters).toBeCloseTo(22.4141, 3);
  });
});

describe("kinematics", () => {
  it("solves v and d from u, a and t", () => {
    const r = kinematics({ initialVelocity: 5, acceleration: 2, time: 4 });
    expect(r.finalVelocity).toBe(13);
    expect(r.displacement).toBe(36);
    expect(r.solved).toEqual(["finalVelocity", "displacement"]);
  });
  it("solves t and d from u, v and a", () => {
    const r = kinematics({ initialVelocity: 0, finalVelocity: 20, acceleration: 4 });
    expect(r.time).toBe(5);
    expect(r.displacement).toBe(50);
  });
  it("solves a and t from u, v and d", () => {
    const r = kinematics({ initialVelocity: 10, finalVelocity: 20, displacement: 75 });
    expect(r.acceleration).toBe(2);
    expect(r.time).toBe(5);
  });
  it("solves from v, a and t, and from a, t and d", () => {
    expect(kinematics({ finalVelocity: 30, acceleration: 3, time: 5 }).initialVelocity).toBe(15);
    expect(kinematics({ acceleration: 2, time: 4, displacement: 36 }).initialVelocity).toBe(5);
  });
  it("solves from u, a and d for a falling object", () => {
    const r = kinematics({ initialVelocity: 0, acceleration: 9.8, displacement: 19.6 });
    expect(r.finalVelocity).toBeCloseTo(19.6, 4);
    expect(r.time).toBeCloseTo(2, 4);
  });
  it("picks the root with a non negative time", () => {
    const r = kinematics({ initialVelocity: 10, acceleration: -2, displacement: 21 });
    expect(r.finalVelocity).toBe(4);
    expect(r.time).toBe(3);
  });
  it("rejects bad input", () => {
    expect(() => kinematics({ initialVelocity: 1, time: 2 })).toThrow(/exactly three/);
    expect(() => kinematics({ initialVelocity: 1, acceleration: 2, time: -1 })).toThrow(/negative/);
    expect(() => kinematics({ initialVelocity: 1, finalVelocity: 5, acceleration: 0 })).toThrow(/division by zero/);
    expect(() => kinematics({ initialVelocity: 0, acceleration: -2, displacement: 5 })).toThrow(/No real solution/);
  });
});
