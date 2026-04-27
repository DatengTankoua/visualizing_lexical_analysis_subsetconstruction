import type { DFA } from "../models/types";

/**
 * Simuliert die Ausführung eines DFA auf einem Eingabewort
 * und liefert die Zustandsfolge zur schrittweisen Visualisierung.
 */

export type SimulationStep = {
  stepIndex: number;
  currentStateId: string;
  consumed: string;
  currentSymbol: string | null;
  remaining: string;
};

export type SimulationResult = {
  steps: SimulationStep[];
  accepted: boolean;
  stoppedEarly: boolean;
  finalStateId: string;
};

export function simulateDfaRun(dfa: DFA, word: string): SimulationResult {
  const steps: SimulationStep[] = [];

  let currentStateId = dfa.startState;

  // Schritt 0: Startkonfiguration vor dem ersten gelesenen Symbol
  steps.push({
    stepIndex: 0,
    currentStateId,
    consumed: "",
    currentSymbol: word.length > 0 ? word[0] : null,
    remaining: word.length > 1 ? word.slice(1) : "",
  });

  for (let i = 0; i < word.length; i++) {
    const symbol = word[i];

    const transition = dfa.transitions.find(
      (t) => t.from === currentStateId && t.symbol === symbol
    );

    // Keine passende Transition gefunden -> Wort wird abgelehnt
    if (!transition) {
      return {
        steps,
        accepted: false,
        stoppedEarly: true,
        finalStateId: currentStateId,
      };
    }

    currentStateId = transition.to;

    steps.push({
      stepIndex: i + 1,
      currentStateId,
      consumed: word.slice(0, i + 1),
      currentSymbol: i + 1 < word.length ? word[i + 1] : null,
      remaining: i + 2 <= word.length ? word.slice(i + 2) : "",
    });
  }

  return {
    steps,
    accepted: dfa.acceptStates.includes(currentStateId),
    stoppedEarly: false,
    finalStateId: currentStateId,
  };
}