# Changelog

## 0.1.1

- Add example prompts to README Tools table
- Update package.json
- Add How it compares section to README contrasting with LMS MCPs
- Clarify formula requirement for grams in stoichiometry descriptions

## 0.1.0

- First release. STEM Calc MCP does the arithmetic of chemistry and physics homework: molar mass, balancing chemical equations, converting between grams, moles and particles, converting units and rounding to significant figures.
- Added `molar_mass`, which reads brackets and hydrates like CuSO4.5H2O and knows 56 common elements. A formula it cannot read is an error, never a zero.
- Added `balance_equation`, `stoichiometry`, `convert_units` and `round_sig_figs`.
- `convert_units` refuses to turn one kind of unit into another, such as metres into seconds.
- `stoichiometry` asks for the chemical formula when grams are involved.
- Every tool has an output schema and returns its result as fields next to the text answer.
