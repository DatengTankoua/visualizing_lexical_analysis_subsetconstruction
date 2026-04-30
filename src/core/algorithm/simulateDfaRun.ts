import type { DFA } from "../models/types";

/**
 * Simuliert die Ausführung eines DFA auf einem Eingabewort
 * und liefert die Zustandsfolge zur schrittweisen Visualisierung.
 */

// Jede SimulationStep enthält die Überblicksinformationen für einen Schritt der Simulation.
export type SimulationStep = {
  stepIndex: number;
  currentStateId: string;
  consumed: string;
  currentSymbol: string | null;
  remaining: string;
};

// Das SimulationResult fasst alle Schritte zusammen und gibt an, ob das Wort akzeptiert wurde, ob die Simulation vorzeitig gestoppt wurde und in welchem Zustand sie endete.
export type SimulationResult = {
  steps: SimulationStep[];
  accepted: boolean;
  stoppedEarly: boolean;
  finalStateId: string;
};

export function simulateDfaRun(dfa: DFA, word: string): SimulationResult {
  const steps: SimulationStep[] = [];  // Alle Schritte der Simulation werden hier gesammelt

  let currentStateId = dfa.startState; // Startzustand definieren

  // Schritt 0: Startkonfiguration vor dem ersten gelesenen Symbol
  steps.push({
    stepIndex: 0,
    currentStateId,
    consumed: "", // Noch kein Symbol konsumiert
    currentSymbol: word.length > 0 ? word[0] : null, // Erstes Symbol oder null, wenn leere Wort ist
    remaining: word.length > 1 ? word.slice(1) : "", // Rest des Wortes nach dem ersten Symbol
  });
  
  // Iteriere über jedes Symbol im Eingabewort
  for (let i = 0; i < word.length; i++) {
    const symbol = word[i];
    // Suche die passende Transition für das aktuelle Symbol und den aktuellen Zustand
    const transition = dfa.transitions.find((t) => t.from === currentStateId && t.symbol === symbol);

    // Keine gültige Transition gefunden -> Wort wird abgelehnt
    if (!transition) {
      return {
        steps,
        accepted: false,
        stoppedEarly: true,
        finalStateId: currentStateId,
      };
    }

    currentStateId = transition.to; // aktueller Zustand wird aktualisiert
    // Füge die Informationen für diesen Schritt der Simulation hinzu
    steps.push({
      stepIndex: i + 1,
      currentStateId,
      consumed: word.slice(0, i + 1),// Alle bisher konsumierten Symbole inklusive des aktuellen Symbols  
      currentSymbol: i + 1 < word.length ? word[i + 1] : null, //
      remaining: i + 2 <= word.length ? word.slice(i + 2) : "", //
    });
  }
  //
  return {
    steps,
    accepted: dfa.acceptStates.includes(currentStateId),//
    stoppedEarly: false,
    finalStateId: currentStateId,
  };
}