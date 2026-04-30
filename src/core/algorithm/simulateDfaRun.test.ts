/**
 * Testübersicht:
 *
 * Diese Tests überprüfen die korrekte Simulation eines DFA auf verschiedenen Ebenen:
 * - Standardfall: vollständige Verarbeitung eines gültigen Wortes (Akzeptanz)
 * - Ablehnung: Wort endet in einem nicht akzeptierenden Zustand
 * - Früher Abbruch: keine passende Transition vorhanden
 * - Randfall: leeres Wort
 *
 * Ziel ist es, sowohl das normale Verhalten als auch wichtige Edge Cases der Simulation abzudecken.
 */

import { describe, it, expect } from "vitest";
import { simulateDfaRun, type SimulationResult } from "./simulateDfaRun";
import type { DFA } from "../models/types";

describe("simulateDfaRun", () => {
  // 
  it("akzeptiert ein gültiges Wort", () => {
    const dfa: DFA = {
      name: "Simple DFA",
      regex: "ab",
      states: ["q0", "q1", "q2"],
      startState: "q0",
      acceptStates: ["q2"],
      alphabet: ["a", "b"],
      transitions: [
        { from: "q0", symbol: "a", to: "q1" },
        { from: "q1", symbol: "b", to: "q2" },
      ],
    };

    const result: SimulationResult = simulateDfaRun(dfa, "ab");

    expect(result.accepted).toBe(true); //
    expect(result.stoppedEarly).toBe(false);
    expect(result.finalStateId).toBe("q2");
    expect(result.steps.map((step) => step.currentStateId)).toEqual(["q0","q1","q2",]);
  });

  it("lehnt ein Wort ab, wenn der Endzustand nicht akzeptierend ist", () => {
    const dfa: DFA = {
      name: "Loop DFA",
      regex: "a*",
      states: ["q0", "q1"],
      startState: "q0",
      acceptStates: ["q0"],
      alphabet: ["a", "b"],
      transitions: [
        { from: "q0", symbol: "a", to: "q0" },
        { from: "q0", symbol: "b", to: "q1" },
        { from: "q1", symbol: "b", to: "q1" },
      ],
    };

    const result: SimulationResult = simulateDfaRun(dfa, "b");

    expect(result.accepted).toBe(false);
    expect(result.stoppedEarly).toBe(false);
    expect(result.finalStateId).toBe("q1");
    expect(result.steps.map((step) => step.currentStateId)).toEqual(["q0","q1",]);
  });

  it("bricht frühzeitig ab, wenn keine passende Transition existiert", () => {
    const dfa: DFA = {
      name: "Partial DFA",
      regex: "a",
      states: ["q0", "q1"],
      startState: "q0",
      acceptStates: ["q1"],
      alphabet: ["a", "b"],
      transitions: [{ from: "q0", symbol: "a", to: "q1" }],
    };

    const result: SimulationResult = simulateDfaRun(dfa, "ab");

    expect(result.accepted).toBe(false);
    expect(result.stoppedEarly).toBe(true);
    expect(result.finalStateId).toBe("q1");
    expect(result.steps.map((step) => step.currentStateId)).toEqual(["q0","q1",]);
  });

  it("behandelt das leere Wort korrekt", () => {
    const dfa: DFA = {
      name: "Empty Word DFA",
      regex: "ε",
      states: ["q0"],
      startState: "q0",
      acceptStates: ["q0"],
      alphabet: [],
      transitions: [],
    };

    const result: SimulationResult = simulateDfaRun(dfa, "");

    expect(result.accepted).toBe(true);
    expect(result.stoppedEarly).toBe(false);
    expect(result.finalStateId).toBe("q0");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toEqual({
      stepIndex: 0,
      currentStateId: "q0",
      consumed: "",
      currentSymbol: null,
      remaining: "",
    });
  });
});