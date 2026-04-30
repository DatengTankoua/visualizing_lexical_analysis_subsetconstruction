import { describe, it, expect } from "vitest";
import { exportDfaToAef } from "@/core/export/exportAef";
import { parseDSL } from "@/core/parser/dslParser";
import { convertNFAtoDFA } from "@/core/algorithm/subsetConstruction";
import type { DFA, Transition } from "@/core/models/types";

function normalizeDfa(dfa: DFA) {
  const sortArr = (a: string[]) => [...a].sort();
  const sortTransitions = (ts: Transition[]) =>
    [...ts].sort((x, y) =>
      (x.from + x.symbol + x.to).localeCompare(y.from + y.symbol + y.to)
    );

  return {
    name: dfa.name ?? "",
    regex: dfa.regex ?? "",
    states: sortArr(dfa.states),
    alphabet: sortArr(dfa.alphabet),
    startState: dfa.startState,
    acceptStates: sortArr(dfa.acceptStates),
    transitions: sortTransitions(dfa.transitions),
  };
}

describe("Roundtrip: Export -> Import -> Convert -> Compare (SRS-081)", () => {
  const mockDfa: DFA = {
    name: "TestAutomaton",
    regex: "(a|b)*",
    states: ["q0", "q1"],
    startState: "q0",
    acceptStates: ["q1"],
    alphabet: ["a", "b"],
    transitions: [
      { from: "q0", symbol: "a", to: "q1" },
      { from: "q1", symbol: "b", to: "q0" },
    ],
  };

  it("TC-047: should be importable without errors and keep information", () => {
    const exported = exportDfaToAef(mockDfa);

    const parsed = parseDSL(exported);
    expect(parsed.success).toBe(true);
    expect(parsed.nfa).toBeDefined();

    const dfa2 = convertNFAtoDFA(parsed.nfa!);

    expect(dfa2.regex).toBe(mockDfa.regex);
    
    expect(dfa2.name).toBe(`${mockDfa.name}_DFA`);
    const n1 = normalizeDfa(mockDfa);
    const n2 = normalizeDfa(dfa2);
    expect({ ...n2, name: "" }).toEqual({ ...n1, name: "" });
  });
});