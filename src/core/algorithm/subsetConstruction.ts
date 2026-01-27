import type { NFA, DFA, Transition } from "../models/types";

/**
 * Repräsentiert einen einzelnen Schritt des Subset Construction Algorithmus
 */
export interface SubsetConstructionStep {
  stepNumber: number;
  description: string;
  currentState: string[];
  currentStateString: string;
  symbol?: string;
  moveResult?: string[];
  epsilonClosureResult?: string[];
  newDFAState?: string;
  isNewState: boolean;
  dfaStates: string[][];
  dfaTransitions: Transition[];
  unmarkedStates: string[][];
  markedStates: string[][];
  isComplete: boolean;
}

/**
 * Ergebnis der Subset Construction mit allen Schritten
 */
export interface SubsetConstructionResult {
  dfa: DFA;
  steps: SubsetConstructionStep[];
}

/**
 * Konvertiert einen NFA in einen DFA mittels Subset Construction Algorithmus
 * 
 * Algorithmus:
 * 1. Berechne Epsilon-Closure des NFA-Startzustands
 * 2. Für jeden DFA-Zustand (Menge von NFA-Zuständen):
 *    - Für jedes Symbol im Alphabet:
 *      - Finde alle erreichbaren NFA-Zustände
 *      - Berechne deren Epsilon-Closure
 *      - Dies wird ein neuer DFA-Zustand
 * 3. DFA-Zustand ist akzeptierend, wenn er mindestens einen NFA-Akzeptierzustand enthält
 */
export function convertNFAtoDFA(nfa: NFA): DFA {
  const result = convertNFAtoDFAWithSteps(nfa);
  return result.dfa;
}

/**
 * Konvertiert NFA zu DFA und liefert alle Zwischenschritte für Visualisierung
 */
export function convertNFAtoDFAWithSteps(nfa: NFA): SubsetConstructionResult {
  // Epsilon-freies Alphabet (ohne ε)
  const alphabet = nfa.alphabet.filter(symbol => symbol !== 'ε');
  
  // DFA-Zustände als Mengen von NFA-Zuständen
  const dfaStates: string[][] = [];
  const dfaTransitions: Transition[] = [];
  const unmarkedStates: string[][] = [];
  const markedStates: string[][] = [];
  
  // Array für alle Schritte
  const steps: SubsetConstructionStep[] = [];
  let stepNumber = 0;
  
  // Startzustand: Epsilon-Closure des NFA-Startzustands
  const startState = epsilonClosure(nfa, [nfa.startState]);
  dfaStates.push(startState);
  unmarkedStates.push(startState);
  
  // Schritt 0: Initialisierung
  steps.push({
    stepNumber: stepNumber++,
    description: `Initialisierung: ε-closure({${nfa.startState}}) = {${startState.join(',')}}`,
    currentState: startState,
    currentStateString: stateSetToString(startState),
    epsilonClosureResult: startState,
    isNewState: true,
    newDFAState: stateSetToString(startState),
    dfaStates: JSON.parse(JSON.stringify(dfaStates)),
    dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
    unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
    markedStates: JSON.parse(JSON.stringify(markedStates)),
    isComplete: false,
  });
  
  // Subset Construction Hauptschleife
  while (unmarkedStates.length > 0) {
    const currentState = unmarkedStates.shift()!;
    markedStates.push(currentState);
    
    // Schritt: Zustand wird verarbeitet
    steps.push({
      stepNumber: stepNumber++,
      description: `Wähle unmarked Zustand: ${stateSetToString(currentState)}`,
      currentState: currentState,
      currentStateString: stateSetToString(currentState),
      isNewState: false,
      dfaStates: JSON.parse(JSON.stringify(dfaStates)),
      dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
      unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
      markedStates: JSON.parse(JSON.stringify(markedStates)),
      isComplete: false,
    });
    
    // Für jedes Symbol im Alphabet
    for (const symbol of alphabet) {
      // Finde alle NFA-Zustände, die von currentState mit symbol erreichbar sind
      const reachableStates = move(nfa, currentState, symbol);
      
      // Schritt: Move-Operation
      steps.push({
        stepNumber: stepNumber++,
        description: `move(${stateSetToString(currentState)}, ${symbol}) = {${reachableStates.join(',') || '∅'}}`,
        currentState: currentState,
        currentStateString: stateSetToString(currentState),
        symbol: symbol,
        moveResult: reachableStates,
        isNewState: false,
        dfaStates: JSON.parse(JSON.stringify(dfaStates)),
        dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
        unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
        markedStates: JSON.parse(JSON.stringify(markedStates)),
        isComplete: false,
      });
      
      // Berechne Epsilon-Closure der erreichbaren Zustände
      const newState = epsilonClosure(nfa, reachableStates);
      
      // Überspringe leere Zustände
      if (newState.length === 0) {
        // Schritt: Leerer Zustand
        steps.push({
          stepNumber: stepNumber++,
          description: `ε-closure({${reachableStates.join(',') || '∅'}}) = ∅ → Keine neue Transition`,
          currentState: currentState,
          currentStateString: stateSetToString(currentState),
          symbol: symbol,
          moveResult: reachableStates,
          epsilonClosureResult: newState,
          isNewState: false,
          dfaStates: JSON.parse(JSON.stringify(dfaStates)),
          dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
          unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
          markedStates: JSON.parse(JSON.stringify(markedStates)),
          isComplete: false,
        });
        continue;
      }
      
      // Schritt: Epsilon-Closure
      steps.push({
        stepNumber: stepNumber++,
        description: `ε-closure({${reachableStates.join(',')}}) = {${newState.join(',')}}`,
        currentState: currentState,
        currentStateString: stateSetToString(currentState),
        symbol: symbol,
        moveResult: reachableStates,
        epsilonClosureResult: newState,
        isNewState: false,
        dfaStates: JSON.parse(JSON.stringify(dfaStates)),
        dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
        unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
        markedStates: JSON.parse(JSON.stringify(markedStates)),
        isComplete: false,
      });
      
      // Prüfe, ob dieser Zustand bereits existiert
      const existingState = dfaStates.find(state => 
        setsEqual(state, newState)
      );
      
      const isNewState = !existingState;
      
      // Der Zielzustand für die Transition (entweder neu oder existierend)
      let targetState: string[];
      
      if (isNewState) {
        // Neuer Zustand gefunden
        dfaStates.push(newState);
        unmarkedStates.push(newState);
        targetState = newState;
        
        // Schritt: Neuer Zustand
        steps.push({
          stepNumber: stepNumber++,
          description: `Neuer DFA-Zustand gefunden: ${stateSetToString(newState)}`,
          currentState: currentState,
          currentStateString: stateSetToString(currentState),
          symbol: symbol,
          epsilonClosureResult: newState,
          newDFAState: stateSetToString(newState),
          isNewState: true,
          dfaStates: JSON.parse(JSON.stringify(dfaStates)),
          dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
          unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
          markedStates: JSON.parse(JSON.stringify(markedStates)),
          isComplete: false,
        });
      } else {
        // Zustand existiert bereits
        targetState = existingState!;
        
        steps.push({
          stepNumber: stepNumber++,
          description: `Zustand ${stateSetToString(newState)} existiert bereits`,
          currentState: currentState,
          currentStateString: stateSetToString(currentState),
          symbol: symbol,
          epsilonClosureResult: newState,
          isNewState: false,
          dfaStates: JSON.parse(JSON.stringify(dfaStates)),
          dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
          unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
          markedStates: JSON.parse(JSON.stringify(markedStates)),
          isComplete: false,
        });
      }
      
      // Füge Transition hinzu
      dfaTransitions.push({
        from: stateSetToString(currentState),
        symbol: symbol,
        to: stateSetToString(targetState)
      });
      
      // Schritt: Transition hinzugefügt
      steps.push({
        stepNumber: stepNumber++,
        description: `Transition hinzugefügt: ${stateSetToString(currentState)} -${symbol}→ ${stateSetToString(targetState)}`,
        currentState: currentState,
        currentStateString: stateSetToString(currentState),
        symbol: symbol,
        isNewState: false,
        dfaStates: JSON.parse(JSON.stringify(dfaStates)),
        dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
        unmarkedStates: JSON.parse(JSON.stringify(unmarkedStates)),
        markedStates: JSON.parse(JSON.stringify(markedStates)),
        isComplete: false,
      });
    }
  }
  
  // DFA-Startzustand
  const dfaStartState = stateSetToString(startState);
  
  // DFA-Akzeptierende Zustände
  const dfaAcceptStates = dfaStates
    .filter(state => containsAcceptState(state, nfa.acceptStates))
    .map(state => stateSetToString(state));
  
  // Erstelle DFA
  const dfa: DFA = {
    name: nfa.name ? `${nfa.name}_DFA` : undefined,
    regex: nfa.regex,
    states: dfaStates.map(state => stateSetToString(state)),
    startState: dfaStartState,
    acceptStates: dfaAcceptStates,
    alphabet: alphabet,
    transitions: dfaTransitions,
  };
  
  // Finaler Schritt
  steps.push({
    stepNumber: stepNumber++,
    description: `Fertig! DFA konstruiert mit ${dfa.states.length} Zuständen und ${dfa.transitions.length} Transitionen`,
    currentState: [],
    currentStateString: '',
    isNewState: false,
    dfaStates: JSON.parse(JSON.stringify(dfaStates)),
    dfaTransitions: JSON.parse(JSON.stringify(dfaTransitions)),
    unmarkedStates: [],
    markedStates: JSON.parse(JSON.stringify(markedStates)),
    isComplete: true,
  });
  
  return { dfa, steps };
}

/**
 * Berechnet die Epsilon-Closure einer Menge von Zuständen
 * 
 * Die Epsilon-Closure enthält alle Zustände, die von den gegebenen Zuständen
 * über Epsilon-Transitionen (ε) erreichbar sind (einschließlich der Ausgangszustände).
 * 
 * Algorithmus: Tiefensuche (DFS) über Epsilon-Transitionen
 */
function epsilonClosure(nfa: NFA, states: string[]): string[] {
  const closure = new Set<string>(states);
  const stack = [...states];
  
  while (stack.length > 0) {
    const state = stack.pop()!;
    
    // Finde alle Epsilon-Transitionen von diesem Zustand
    const epsilonTransitions = nfa.transitions.filter(
      t => t.from === state && t.symbol === 'ε'
    );
    
    // Füge Zielzustände zur Closure hinzu
    for (const transition of epsilonTransitions) {
      if (!closure.has(transition.to)) {
        closure.add(transition.to);
        stack.push(transition.to);
      }
    }
  }
  
  // Sortiere für konsistente Zustandsnamen
  return Array.from(closure).sort();
}

/**
 * Move-Funktion: Findet alle Zustände, die von einer Menge von Zuständen
 * mit einem gegebenen Symbol erreichbar sind (ohne Epsilon-Transitionen)
 */
function move(nfa: NFA, states: string[], symbol: string): string[] {
  const reachable = new Set<string>();
  
  for (const state of states) {
    // Finde alle Transitionen mit dem gegebenen Symbol
    const transitions = nfa.transitions.filter(
      t => t.from === state && t.symbol === symbol
    );
    
    // Füge Zielzustände hinzu
    for (const transition of transitions) {
      reachable.add(transition.to);
    }
  }
  
  return Array.from(reachable).sort();
}

/**
 * Prüft, ob zwei Mengen von Zuständen gleich sind
 */
function setsEqual(set1: string[], set2: string[]): boolean {
  if (set1.length !== set2.length) {
    return false;
  }
  
  const sorted1 = [...set1].sort();
  const sorted2 = [...set2].sort();
  
  return sorted1.every((state, index) => state === sorted2[index]);
}

/**
 * Konvertiert eine Menge von Zuständen in einen String-Repräsentation
 * Beispiel: ['q0', 'q1'] -> '{q0,q1}'
 */
function stateSetToString(states: string[]): string {
  if (states.length === 0) {
    return '∅';
  }
  
  if (states.length === 1) {
    return states[0];
  }
  
  return `{${states.join(',')}}`;
}

/**
 * Prüft, ob eine Menge von Zuständen mindestens einen akzeptierenden Zustand enthält
 */
function containsAcceptState(states: string[], acceptStates: string[]): boolean {
  return states.some(state => acceptStates.includes(state));
}
