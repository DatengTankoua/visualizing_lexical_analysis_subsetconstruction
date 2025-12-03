import type { NFA, ParseResult, Transition } from "../models/types";
import { DSLParseError } from "../models/types";

/**
 * Parst eine DSL-Eingabe und gibt ein ParseResult zurück
 */
export function parseDSL(input: string): ParseResult {
  try {
    const nfa = parseDSLUnsafe(input);
    return {
      success: true,
      nfa
    };
  } catch (error) {
    if (error instanceof DSLParseError) {
      return {
        success: false,
        error: error.message,
        line: error.line
      };
    }
    return {
      success: false,
      error: `Unbekannter Fehler: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Interne Parser-Funktion die Exceptions wirft
 */
function parseDSLUnsafe(input: string): NFA {
  const lines = input.split('\n').map((line, index) => ({ 
    content: line.trim(), 
    number: index + 1 
  }));
  
  const nfa: NFA = {
    states: [],
    alphabet: [],
    startState: "",
    acceptStates: [],
    transitions: []
  };


  
  for (const { content, number } of lines) {
    // Überspringe leere Zeilen
    if (!content) continue;
    
    // Parse Kommentare und Metadaten
    if (content.startsWith('#')) {
      const metaMatch = content.match(/^#\s*@(\w+)\s+(.+)$/);
      if (metaMatch) {
        const [, key, value] = metaMatch;
        if (key === 'NAME') {
          nfa.name = value;
        } else if (key === 'REGEX') {
          nfa.regex = value;
        }
      }
      continue;
    }

    // Parse Sektionen
    const words = content.split(/\s+/);
    const firstWord = words[0].toLowerCase();

    switch (firstWord) {
      case 'states':
        if (words.length < 2) {
          throw new DSLParseError('States-Sektion benötigt mindestens einen Zustand', number);
        }
        nfa.states = words.slice(1);
        break;

      case 'alphabet':
        if (words.length < 2) {
          throw new DSLParseError('Alphabet-Sektion benötigt mindestens ein Symbol', number);
        }
        nfa.alphabet = words.slice(1);
        break;

      case 'start': {
        if (words.length !== 2) {
          throw new DSLParseError('Start-Sektion benötigt genau einen Zustand', number);
        }
        const startState = words[1];
        if (!nfa.states.includes(startState)) {
          throw new DSLParseError(`Start-Zustand '${startState}' ist nicht in der States-Liste definiert`, number);
        }
        nfa.startState = startState;
        break;
      }

      case 'accept': {
        if (words.length < 2) {
          throw new DSLParseError('Accept-Sektion benötigt mindestens einen Zustand', number);
        }
        const acceptStates = words.slice(1);
        for (const state of acceptStates) {
          if (!nfa.states.includes(state)) {
            throw new DSLParseError(`Akzeptierender Zustand '${state}' ist nicht in der States-Liste definiert`, number);
          }
        }
        nfa.acceptStates = acceptStates;
        break;
      }

      default:
        // Parse Übergänge
        if (words.length === 3) {
          const [from, symbol, to] = words;
          
          // Validiere Zustände
          if (!nfa.states.includes(from)) {
            throw new DSLParseError(`Zustand '${from}' ist nicht definiert`, number);
          }
          if (!nfa.states.includes(to)) {
            throw new DSLParseError(`Zustand '${to}' ist nicht definiert`, number);
          }
          
          // Validiere Symbol
          if (!nfa.alphabet.includes(symbol)) {
            throw new DSLParseError(`Symbol '${symbol}' ist nicht im Alphabet definiert`, number);
          }

          const transition: Transition = { from, symbol, to };
          nfa.transitions.push(transition);
        } else if (words.length > 0) {
          throw new DSLParseError(`Ungültige Zeile: '${content}'. Erwartetes Format: 'von_zustand symbol zu_zustand' oder Sektion`, number);
        }
        break;
    }
  }

  // Validiere vollständige NFA
  validateNFA(nfa);
  
  return nfa;
}

/**
 * Validiert ein vollständig geparste NFA
 */
function validateNFA(nfa: NFA): void {
  if (nfa.states.length === 0) {
    throw new DSLParseError('Keine Zustände definiert');
  }
  
  if (nfa.alphabet.length === 0) {
    throw new DSLParseError('Kein Alphabet definiert');
  }
  
  if (!nfa.startState) {
    throw new DSLParseError('Kein Start-Zustand definiert');
  }
  
  if (nfa.acceptStates.length === 0) {
    throw new DSLParseError('Keine akzeptierenden Zustände definiert');
  }

  // Prüfe auf doppelte Zustände
  const uniqueStates = new Set(nfa.states);
  if (uniqueStates.size !== nfa.states.length) {
    throw new DSLParseError('Doppelte Zustände in der States-Liste');
  }

  // Prüfe auf doppelte akzeptierende Zustände
  const uniqueAcceptStates = new Set(nfa.acceptStates);
  if (uniqueAcceptStates.size !== nfa.acceptStates.length) {
    throw new DSLParseError('Doppelte akzeptierende Zustände in der Accept-Liste');
  }

  // Prüfe auf doppelte Alphabet-Symbole
  const uniqueSymbols = new Set(nfa.alphabet);
  if (uniqueSymbols.size !== nfa.alphabet.length) {
    throw new DSLParseError('Doppelte Symbole im Alphabet');
  }

  //Prüfe auf doppelte Übergänge
  const transitionSet = new Set<string>();
  for (const transition of nfa.transitions) {
    const key = `${transition.from}-${transition.symbol}-${transition.to}`;
    if (transitionSet.has(key)) {
      throw new DSLParseError(`Doppelter Übergang: ${key}`);
    }
    transitionSet.add(key);
  }
}