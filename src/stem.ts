// Minimal periodic table: symbol -> atomic mass
export const ATOMS: Record<string, number> = {
  H:1.008, He:4.0026, Li:6.94, Be:9.0122, B:10.81, C:12.011, N:14.007, O:15.999, F:18.998, Ne:20.18,
  Na:22.99, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06, Cl:35.45, K:39.098, Ca:40.078, Fe:55.845,
  Cu:63.546, Zn:65.38, Br:79.904, Ag:107.868, I:126.904, Ba:137.327, Pb:207.2,
  Ar:39.948, Sc:44.956, Ti:47.867, V:50.942, Cr:51.996, Mn:54.938, Co:58.933, Ni:58.693, Ga:69.723, Ge:72.630,
  As:74.922, Se:78.971, Kr:83.798, Rb:85.468, Sr:87.62, Zr:91.224, Mo:95.95, Cd:112.414, Sn:118.71, Sb:121.760,
  Te:127.60, Xe:131.293, Cs:132.905, W:183.84, Pt:195.084, Au:196.967, Hg:200.592, Bi:208.980, U:238.029,
};

/** One formula part with no hydrate dot, like Ca(OH)2 or Fe2(SO4)3. */
function parseGroup(formula: string): Record<string, number> {
  const out: Record<string, number> = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let m: RegExpExecArray | null;
  // handle parentheses
  const expand = (s: string): string => {
    let res = s;
    // simple: repeat parenthesized groups
    let changed = true;
    while (changed) {
      changed = false;
      res = res.replace(/\(([^()]+)\)(\d+)/g, (_, g, n) => { changed = true; return g.repeat(Number(n)); });
    }
    return res;
  };
  const flat = expand(formula.replace(/\[/g, "(").replace(/\]/g, ")"));
  // anything left once the element symbols, numbers and brackets are taken out is not a formula (a lower case h2o, a stray letter)
  if (flat.replace(/[A-Z][a-z]?\d*/g, "").replace(/[()]/g, "") !== "") throw new Error(`"${formula}" is not a chemical formula. Write each element with a capital first letter, like H2O or Ca(OH)2.`);
  while ((m = re.exec(flat)) !== null) {
    if (!m[1]) continue;
    const sym = m[1];
    const cnt = m[2] ? Number(m[2]) : 1;
    if (!(sym in ATOMS)) throw new Error(`Unknown element ${sym}`);
    out[sym] = (out[sym] || 0) + cnt;
  }
  return out;
}

/** The element counts of a formula, hydrates included: CuSO4.5H2O is CuSO4 plus five H2O. */
export function parseFormula(formula: string): Record<string, number> {
  const text = String(formula ?? "").trim();
  if (!text) throw new Error("Pass a chemical formula like H2O.");
  if (/[^A-Za-z0-9()[\].·*•]/.test(text)) throw new Error(`"${formula}" is not a chemical formula. Use element symbols and numbers, like Ca(OH)2.`);
  const out: Record<string, number> = {};
  for (const part of text.split(/[.·*•]/)) {
    const lead = /^(\d+)(.*)$/.exec(part), times = lead ? Number(lead[1]) : 1, body = lead ? lead[2] : part;
    if (!body) throw new Error(`"${formula}" is not a chemical formula. A dot needs a formula after it, like CuSO4.5H2O.`);
    for (const [el, c] of Object.entries(parseGroup(body))) out[el] = (out[el] || 0) + c * times;
  }
  return out;
}

export function molarMass(formula: string): { mass: number; breakdown: { element: string; count: number; mass: number }[] } {
  const counts = parseFormula(formula);
  // rounded to 4 decimals so float noise like 74.09200000000001 never reaches the answer
  const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
  const breakdown = Object.entries(counts).map(([el, c]) => ({ element: el, count: c, mass: round4(ATOMS[el] * c) }));
  const mass = round4(breakdown.reduce((s, b) => s + b.mass, 0));
  return { mass, breakdown };
}

// Unit conversion factors to base SI
const FACTORS: Record<string, number> = {
  m:1, km:1000, cm:0.01, mm:0.001, in:0.0254, ft:0.3048,
  g:0.001, kg:1, mg:1e-6, lb:0.453592,
  s:1, min:60, h:3600,
  L:0.001, mL:1e-6, "m^3":1,
  J:1, kJ:1000, cal:4.184, kcal:4184,
  K:1, C:1, F:1,
  Pa:1, kPa:1000, atm:101325, mmHg:101325/760, bar:100000, psi:6894.757293168,
  "m/s":1, "km/h":1/3.6,
  "m^3/s":1, "L/s":0.001, "L/min":0.001/60, "mL/min":1e-6/60,
};
/** What each unit measures, so a length is never converted to a time. */
const KINDS: Record<string, string[]> = {
  length: ["m", "km", "cm", "mm", "in", "ft"],
  mass: ["g", "kg", "mg", "lb"],
  time: ["s", "min", "h"],
  volume: ["L", "mL", "m^3"],
  energy: ["J", "kJ", "cal", "kcal"],
  temperature: ["K", "C", "F"],
  pressure: ["Pa", "kPa", "atm", "mmHg", "bar", "psi"],
  speed: ["m/s", "km/h"],
  flow: ["m^3/s", "L/s", "L/min", "mL/min"],
};
const kindOf = (unit: string) => Object.keys(KINDS).find((k) => KINDS[k].includes(unit));
/** Common spellings people type, mapped to the unit names above. Keys are lower case. */
const ALIASES: Record<string, string> = {
  "°c": "C", degc: "C", celsius: "C", "°f": "F", degf: "F", fahrenheit: "F", kelvin: "K",
  litre: "L", liter: "L", litres: "L", liters: "L", millilitre: "mL", milliliter: "mL", cc: "mL", cm3: "mL", "cm^3": "mL",
  m3: "m^3", "m³": "m^3", lpm: "L/min", "l/m": "L/min", "l per min": "L/min", "ml per min": "mL/min",
  "l/sec": "L/s", "m3/s": "m^3/s", "m³/s": "m^3/s",
  kmh: "km/h", kph: "km/h", "m/sec": "m/s", mps: "m/s",
  sec: "s", second: "s", seconds: "s", mins: "min", minute: "min", minutes: "min", hr: "h", hrs: "h", hour: "h", hours: "h",
  inch: "in", inches: "in", feet: "ft", foot: "ft", lbs: "lb", pound: "lb", pounds: "lb",
  gram: "g", grams: "g", kilogram: "kg", kilograms: "kg", meter: "m", metre: "m", meters: "m", metres: "m",
  torr: "mmHg",
};
/** The unit name this server uses for what was typed, or the trimmed text if it is not recognised. */
function canonicalUnit(unit: string): string {
  const u = String(unit ?? "").trim();
  if (u in FACTORS) return u;
  const lower = u.toLowerCase().replace(/\s+/g, " ");
  if (lower in ALIASES) return ALIASES[lower];
  const hits = Object.keys(FACTORS).filter((k) => k.toLowerCase() === lower);
  return hits.length === 1 ? hits[0] : u;
}
export function convertUnits(value: number, fromUnit: string, toUnit: string): number {
  const from = canonicalUnit(fromUnit), to = canonicalUnit(toUnit);
  const a = kindOf(from), b = kindOf(to);
  if (a && b && a !== b) throw new Error(`Cannot convert ${from} to ${to}: ${from} measures ${a} and ${to} measures ${b}.`);
  if (from === "C" && to === "K") return value + 273.15;
  if (from === "K" && to === "C") return value - 273.15;
  if (from === "F" && to === "C") return (value-32)*5/9;
  if (from === "C" && to === "F") return value*9/5+32;
  if (from === "F" && to === "K") return (value-32)*5/9+273.15;
  if (from === "K" && to === "F") return (value-273.15)*9/5+32;
  const f = FACTORS[from], t = FACTORS[to];
  if (f === undefined || t === undefined) throw new Error(`Unknown unit ${f === undefined ? fromUnit : toUnit}. Try a unit like km, kg, mL, L/min, J, C, atm or km/h.`);
  return value * f / t;
}

export function roundSigFigs(value: number, sig: number): number {
  if (sig <= 0) throw new Error("sig figs must be > 0");
  if (!Number.isFinite(value)) throw new Error("Pass a number to round.");
  if (value === 0) return 0;
  const factor = Math.pow(10, sig - Math.floor(Math.log10(Math.abs(value))) - 1);
  return Math.round(value * factor) / factor;
}

// Stoichiometry helpers
export function gramsToMoles(grams: number, formula: string): number {
  return grams / molarMass(formula).mass;
}
export function molesToGrams(moles: number, formula: string): number {
  return moles * molarMass(formula).mass;
}
export function molesToParticles(moles: number): number {
  return moles * 6.02214076e23;
}

// Equation balancer: exact nullspace solve with integer coefficients for any number of species
export function balanceEquation(eq: string): string {
  const parts = eq.split(/->|=>|→|⟶|⇒|⟹|=/);
  if (parts.length < 2) throw new Error(`Equation "${eq}" has no arrow. Write reactants and products separated by -> (or = or →), for example "H2 + O2 -> H2O".`);
  if (parts.length > 2) throw new Error(`Equation "${eq}" has more than one arrow. Use exactly one -> between reactants and products.`);
  const sides = parts.map((p, i) => {
    const species = p.split("+").map((s) => s.trim());
    if (species.some((s) => s === "")) {
      throw new Error(`The ${i === 0 ? "reactant" : "product"} side of "${eq}" is empty or has a stray +. Put a formula on each side of every +.`);
    }
    return species;
  });
  const [left, right] = sides;
  // null space of the element matrix, with exact fractions
  const counts = [...left, ...right].map((f) => parseFormula(f));
  const elems = [...new Set(counts.flatMap((c) => Object.keys(c)))];
  for (const e of elems) {
    const onLeft = counts.slice(0, left.length).some((c) => c[e]);
    const onRight = counts.slice(left.length).some((c) => c[e]);
    if (onLeft !== onRight) {
      throw new Error(`Cannot balance: ${e} appears only on the ${onLeft ? "reactant" : "product"} side of "${eq}". Every element must be on both sides.`);
    }
  }
  const n = counts.length;
  const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
  type Fr = [number, number];
  const norm = (a: number, b: number): Fr => {
    const g = gcd(a, b) || 1;
    return b < 0 ? [-a / g, -b / g] : [a / g, b / g];
  };
  const m: Fr[][] = elems.map((e) => counts.map((c, j) => [(c[e] || 0) * (j < left.length ? 1 : -1), 1] as Fr));
  const pivots: number[] = [];
  let row = 0;
  for (let col = 0; col < n && row < m.length; col++) {
    const p = m.findIndex((r, i) => i >= row && r[col][0] !== 0);
    if (p < 0) continue;
    [m[row], m[p]] = [m[p], m[row]];
    const [pn, pd] = m[row][col];
    m[row] = m[row].map(([a, b]) => norm(a * pd, b * pn));
    for (let i = 0; i < m.length; i++) {
      if (i === row || m[i][col][0] === 0) continue;
      const [fn, fd] = m[i][col];
      m[i] = m[i].map(([a, b], j) => {
        const [ra, rb] = m[row][j];
        return norm(a * fd * rb - ra * fn * b, b * fd * rb);
      });
    }
    pivots.push(col);
    row++;
  }
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c));
  if (free.length === 0) throw new Error(`Could not balance "${eq}": no set of whole number coefficients works. Check the formulas for typos.`);
  if (free.length > 1) throw new Error(`Could not balance "${eq}": it has more than one valid answer, so the species are not independent. Split it into separate reactions.`);
  const sol: Fr[] = Array.from({ length: n }, () => [0, 1] as Fr);
  sol[free[0]] = [1, 1];
  pivots.forEach((c, i) => {
    const [a, b] = m[i][free[0]];
    sol[c] = [-a, b];
  });
  const lcm = sol.reduce((acc, [, d]) => (acc * d) / gcd(acc, d), 1);
  let ints = sol.map(([a, b]) => (a * lcm) / b);
  const g = ints.reduce((acc, x) => gcd(acc, x), 0);
  ints = ints.map((x) => x / g);
  if (ints.some((x) => x <= 0)) throw new Error(`Could not balance "${eq}": the only solution needs a negative coefficient, so a species is probably on the wrong side.`);
  const fmt = (arr: string[], off: number) => arr.map((f, i) => (ints[off + i] === 1 ? "" : ints[off + i]) + f).join(" + ");
  return `${fmt(left, 0)} -> ${fmt(right, left.length)}`;
}
