export type State = string;

export interface Transition {
  from: State;
  symbol: string; // includes epsilon as "ε"
  to: State;
}

export interface NFA {
  states: State[];
  alphabet: string[];
  startState: State;
  acceptStates: State[];
  transitions: Transition[];
  name?: string;
  regex?: string;
  hasEpsilon?: boolean; // Ob der NFA Epsilon-Übergänge enthält
}

export interface DFA {
  name?: string;
  regex?: string;
  states: State[];
  alphabet: string[];
  startState: State;
  acceptStates: State[];
  transitions: Transition[];
}

export interface ParseResult {
  success: boolean;
  nfa?: NFA;
  error?: string;
  line?: number;
}

export class DSLParseError extends Error {
  line?: number;
  column?: number;
  
  constructor(message: string, line?: number, column?: number) {
    super(message);
    this.name = 'DSLParseError';
    this.line = line;
    this.column = column;
  }
}
