import type { NFA } from "../models/types";

export function parseDSL(input: string): NFA {
  // TODO: Implementierung des DSL-Parsers
  console.log("Parsing DSL...");
  return {
    states: [],
    alphabet: [],
    startState: "",
    acceptStates: [],
    transitions: []
  };
}
