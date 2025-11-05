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
}

export interface DFA {
  states: State[];
  alphabet: string[];
  startState: State;
  acceptStates: State[];
  transitions: Transition[];
}
