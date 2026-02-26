import { describe, it, expect } from "vitest";
import { exportDfaToAef } from "./exportAef";
import { parseDSL } from "../parser/dslParser";
import type { DFA } from "../models/types";

/**
 * Testet den Export eines DFA im AEF-Format.
 * Deckt folgende Anforderungen ab:
 *  - SRS-076: syntaktisch korrektes AEF
 *  - SRS-077: @NAME im Export vorhanden
 *  - SRS-078: @REGEX im Export vorhanden
 */

describe("exportDfaToAef", () => {
  const mockDfa: DFA = {
    name: "TestAutomaton",
    regex: "(a|b)*",
    states: ["q0", "q1"],
    startState: "q0",
    acceptStates: ["q1"],
    alphabet: ["a", "b"],
    transitions: [
      { from: "q0", symbol: "a", to: "q1" },
      { from: "q1", symbol: "b", to: "q0" }
    ]
  };

  it("should include @NAME", () => {
    const output = exportDfaToAef(mockDfa);
    expect(output).toContain("# @NAME TestAutomaton");
  });

  it("should include @REGEX unchanged", () => {
    const output = exportDfaToAef(mockDfa);
    expect(output).toContain("# @REGEX (a|b)*");
  });

  it("should produce syntactically valid AEF", () => {
    const output = exportDfaToAef(mockDfa);
    const result = parseDSL(output);
    expect(result.success).toBe(true);
  });
});
