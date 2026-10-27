import { describe, it, expect } from "vitest";
import { molarMass, parseFormula, balanceEquation, convertUnits, roundSigFigs, gramsToMoles } from "../src/stem.js";
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
  it("says so when it cannot", () => {
    expect(() => balanceEquation("H2 -> O2")).toThrow(/balance/);
    expect(() => balanceEquation("hello")).toThrow(/->/);
  });
});

describe("convert_units", () => {
  it("converts within one kind of unit", () => {
    expect(convertUnits(2, "km", "m")).toBe(2000);
    expect(convertUnits(500, "mL", "L")).toBe(0.5);
    expect(convertUnits(100, "C", "F")).toBe(212);
    expect(convertUnits(0, "C", "K")).toBe(273.15);
  });
  it("refuses to convert a length into a time, or a mass into a volume", () => {
    expect(() => convertUnits(1, "m", "s")).toThrow(/length.*time/);
    expect(() => convertUnits(1, "kg", "L")).toThrow(/mass.*volume/);
    expect(() => convertUnits(1, "C", "kg")).toThrow(/temperature.*mass/);
  });
  it("names a unit it does not know", () => {
    expect(() => convertUnits(1, "parsec", "m")).toThrow(/Unknown unit/);
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
