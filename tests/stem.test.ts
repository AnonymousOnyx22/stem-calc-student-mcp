import { describe, it, expect } from "vitest";
import { molarMass, balanceEquation, convertUnits, roundSigFigs, gramsToMoles } from "../src/stem.js";

describe("stem", () => {
  it("molar mass water", () => { expect(molarMass("H2O").mass).toBeCloseTo(18.015, 2); });
  it("balance", () => { expect(balanceEquation("H2 + O2 -> H2O")).toContain("->"); });
  it("convert", () => { expect(convertUnits(1, "km", "m")).toBe(1000); });
  it("sig figs", () => { expect(roundSigFigs(1.2345, 3)).toBeCloseTo(1.23, 2); });
  it("grams to moles", () => { expect(gramsToMoles(18.015, "H2O")).toBeCloseTo(1, 2); });
});
