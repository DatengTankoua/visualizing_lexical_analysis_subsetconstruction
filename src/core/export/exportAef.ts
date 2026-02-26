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
  const alreadyExportedStates: Set<string> = new Set<string>();

  // ---- Metadaten ----
  // Falls intern "_DFA" angehängt wurde → beim Export wieder entfernen
  const exportName = dfa.name.endsWith("_DFA") ? dfa.name.slice(0, -4) : dfa.name;

  lines.push(`# @NAME ${exportName}`);
  lines.push(`# @REGEX ${dfa.regex}`);
  lines.push("");

  // ---- Transitionen gruppieren ----
  const transitionsByState: Record<string, Transition[]> = {};
  for (const transition of dfa.transitions) {
    (transitionsByState[transition.from] ??= []).push(transition);
  }

  const normalizeState = (state: string) =>
  state.replace(/[{}]/g, "").replace(/,/g, "_");

const formatTarget = (state: string) => {
  const normalized = normalizeState(state);
  if(alreadyExportedStates.has(state)) {
    return normalized;
  }
  alreadyExportedStates.add(state);
  return dfa.acceptStates.includes(state)
    ? `(${normalized})`
    : normalized;
};

const formatFrom = (state: string) => {
  const normalized = normalizeState(state);
  const isStart = state === dfa.startState;
  const isAccept = dfa.acceptStates.includes(state);
  
  if(alreadyExportedStates.has(state)) {
    return normalized;
  }
  alreadyExportedStates.add(state);
  if (isStart && isAccept) return `(.${normalized})`;
  if (isStart) return `.${normalized}`;
  return normalized;
};

// ---- Zeilen exportieren ----
  for (const t of dfa.transitions) {
    let line = `${formatFrom(t.from)} -${t.symbol}> ${formatTarget(t.to)}`;
    line += ";";
    lines.push(line);
  }

  return lines.join("\n");
}