import type { DFA, Transition } from "../models/types";

/**
 * Exportiert einen DFA im AEF-Format.
 *
 * Erfüllt:
 *  - SRS-076: syntaktisch korrektes AEF
 *  - SRS-077: @NAME vorhanden
 *  - SRS-078: @REGEX vorhanden
 */
export function exportDfaToAef(dfa: DFA): string {
  if (!dfa.name) {
    throw new Error("DFA hat kein @NAME Feld");
  }

  if (!dfa.regex) {
    throw new Error("DFA hat kein @REGEX Feld");
  }

  const lines: string[] = [];

  // ---- Metadaten ----
  // Falls intern "_DFA" angehängt wurde → beim Export wieder entfernen
  const exportName = dfa.name.endsWith("_DFA")
    ? dfa.name.slice(0, -4)
    : dfa.name;

  lines.push(`# @NAME ${exportName}`);
  lines.push(`# @REGEX ${dfa.regex}`);
  lines.push("");

  // ---- Transitionen gruppieren ----
  const transitionsByState: Record<string, Transition[]> = {};

  for (const transition of dfa.transitions) {
    if (!transitionsByState[transition.from]) {
      transitionsByState[transition.from] = [];
    }
    transitionsByState[transition.from].push(transition);
  }

  // ---- Zustände exportieren ----
  for (const state of dfa.states) {
    const stateTransitions = transitionsByState[state] || [];

    let stateToken = state;

    // Startzustand markieren
    if (state === dfa.startState) {
      stateToken = `.${stateToken}`;
    }

    // Akzeptierzustand markieren
    if (dfa.acceptStates.includes(state)) {
      stateToken = `(${stateToken})`;
    }

    let line = stateToken;

    for (const t of stateTransitions) {
      line += ` -${t.symbol}> ${t.to}`;
    }

    line += ";";
    lines.push(line);
  }

  return lines.join("\n");
}
