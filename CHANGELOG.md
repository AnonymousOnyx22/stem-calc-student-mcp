# Changelog

## Unreleased

- Added `limiting_reagent`, which balances a reaction and finds the limiting reagent, the theoretical yield and the grams left over of each excess reactant.
- Added `solution_math`, which solves molarity (M = mol/L) and dilution (M1V1 = M2V2) problems for the value you leave out.
- Added `percent_composition`, which gives the percent by mass of each element in a formula.
- Added `empirical_formula`, which finds the simplest whole number formula from mass composition or element percentages.
- convert_units now lists every supported unit by category in its unknown unit error, so mistyped units such as mmHg or km/h show what is supported instead of a dead end.

## 0.1.3

- Every tool now reports openWorldHint: false, so clients can see that the server works offline.
- convert_units now accepts common spellings such as ml, degC and °C, and converts flow rates (L/min, mL/min, L/s, m^3/s).
- convert_units now handles pressure (Pa, kPa, atm, mmHg, bar, psi) and speed (m/s, km/h).
- balance_equation now handles any number of reactants and products, so reactions like KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2 balance correctly.
- balance_equation now accepts = or a unicode arrow, and its errors say what is wrong, such as a missing arrow, an empty side, or an element that appears on only one side.

## 0.1.2

- The npm description and keywords now use the phrase STEM calculator MCP, so the package is easier to find when you search for it.

## 0.1.1

- The stoichiometry tool description now says clearly that a chemical formula is needed whenever grams are involved.
- The README tools table has an example prompt for each tool, and a new section says how this server differs from servers that read a course platform.
- More search keywords for chemistry and physics homework in the package.

## 0.1.0

- First release. STEM Calc MCP does the arithmetic of chemistry and physics homework: molar mass, balancing chemical equations, converting between grams, moles and particles, converting units and rounding to significant figures.
- Added `molar_mass`, which reads brackets and hydrates like CuSO4.5H2O and knows 56 common elements. A formula it cannot read is an error, never a zero.
- Added `balance_equation`, `stoichiometry`, `convert_units` and `round_sig_figs`.
- `convert_units` refuses to turn one kind of unit into another, such as metres into seconds.
- `stoichiometry` asks for the chemical formula when grams are involved.
- Every tool has an output schema and returns its result as fields next to the text answer.
