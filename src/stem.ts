// Minimal periodic table: symbol -> atomic mass
export const ATOMS: Record<string, number> = {
  H:1.008, He:4.0026, Li:6.94, Be:9.0122, B:10.81, C:12.011, N:14.007, O:15.999, F:18.998, Ne:20.18,
  Na:22.99, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06, Cl:35.45, K:39.098, Ca:40.078, Fe:55.845,
  Cu:63.546, Zn:65.38, Br:79.904, Ag:107.868, I:126.904, Ba:137.327, Pb:207.2,
};

export function parseFormula(formula: string): Record<string, number> {
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
  const flat = expand(formula);
  while ((m = re.exec(flat)) !== null) {
    if (!m[1]) continue;
    const sym = m[1];
    const cnt = m[2] ? Number(m[2]) : 1;
    if (!(sym in ATOMS)) throw new Error(`Unknown element ${sym}`);
    out[sym] = (out[sym] || 0) + cnt;
  }
  return out;
}

export function molarMass(formula: string): { mass: number; breakdown: { element: string; count: number; mass: number }[] } {
  const counts = parseFormula(formula);
  const breakdown = Object.entries(counts).map(([el, c]) => ({ element: el, count: c, mass: ATOMS[el] * c }));
  const mass = breakdown.reduce((s, b) => s + b.mass, 0);
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
};
export function convertUnits(value: number, from: string, to: string): number {
  if (from === "C" && to === "K") return value + 273.15;
  if (from === "K" && to === "C") return value - 273.15;
  if (from === "F" && to === "C") return (value-32)*5/9;
  if (from === "C" && to === "F") return value*9/5+32;
  if (from === "F" && to === "K") return (value-32)*5/9+273.15;
  if (from === "K" && to === "F") return (value-273.15)*9/5+32;
  const f = FACTORS[from], t = FACTORS[to];
  if (f === undefined || t === undefined) throw new Error(`Unknown unit ${from} or ${to}`);
  return value * f / t;
}

export function roundSigFigs(value: number, sig: number): number {
  if (sig <= 0) throw new Error("sig figs must be > 0");
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

// Simple equation balancer for A + B -> C style with integer coefficients via brute force
export function balanceEquation(eq: string): string {
  const parts = eq.split("->");
  if (parts.length !== 2) throw new Error("Equation must contain ->");
  const left = parts[0].split("+").map(s=>s.trim());
  const right = parts[1].split("+").map(s=>s.trim());
  // brute force small coefficients
  for (let a=1;a<=20;a++) for (let b=1;b<=20;b++) for (let c=1;c<=20;c++) for (let d=1;d<=20;d++) {
    // support up to 2 reactants and 2 products
    const lCounts: Record<string,number> = {};
    const rCounts: Record<string,number> = {};
    const add = (arr:string[], coeffs:number[], target:Record<string,number>) => {
      arr.forEach((f,i)=>{ const cnt=parseFormula(f); for(const el in cnt) target[el]=(target[el]||0)+cnt[el]*coeffs[i]; });
    };
    const lc = [a,b]; const rc=[c,d];
    // pad
    while (lc.length < left.length) lc.push(1);
    while (rc.length < right.length) rc.push(1);
    add(left, lc.slice(0,left.length), lCounts);
    add(right, rc.slice(0,right.length), rCounts);
    let ok = true;
    const elems = new Set([...Object.keys(lCounts),...Object.keys(rCounts)]);
    for (const e of elems) if ((lCounts[e]||0)!==(rCounts[e]||0)) { ok=false; break; }
    if (ok) {
      const fmt = (arr:string[], coeffs:number[]) => arr.map((f,i)=> (coeffs[i]===1?"":coeffs[i]) + f).join(" + ");
      return `${fmt(left,lc.slice(0,left.length))} -> ${fmt(right,rc.slice(0,right.length))}`;
    }
  }
  throw new Error("Could not balance");
}
