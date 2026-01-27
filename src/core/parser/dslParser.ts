import type { NFA, ParseResult, Transition } from "../models/types";
import { DSLParseError } from "../models/types";

/**
 * Parst eine DSL-Eingabe (AEF-Format) und gibt ein ParseResult zurück
 * 
 * AEF-Format:
 * - Metadaten: # @NAME name, # @REGEX regex
 * - Transitionen: .q0 -1> q1 -0> q2;
 * - Startzustand: . vor dem State (z.B. .q0)
 * - Akzeptierender Zustand: () um den State (z.B. (q1))
 * - Epsilon-Transitionen: -ε> oder -epsilon>
 * - Jede Datei sollte genau eine NFA-Definition enthalten
 */
export function parseDSL(input: string): ParseResult {
  try {
    const nfa = parseAEFFormat(input);
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
 * Parst das AEF-Format und gibt eine einzelne NFA zurück
 */
function parseAEFFormat(input: string): NFA {
  const lines = input.split('\n').map((line, index) => ({ 
    content: line.trim(), 
    number: index + 1 
  }));
  
  const nfa = createEmptyNFA();
  let hasTransitions = false;
  
  // Tracking für Zustandsmarkierungen (einmalige Markierung reicht)
  const stateMarkings = new Map<string, { isStart: boolean; isAccept: boolean; firstLine: number }>();

  for (const { content, number } of lines) {
    // Überspringe leere Zeilen
    if (!content) {
      continue;
    }

    // Parse Kommentare und Metadaten
    if (content.startsWith('#')) {
      const metaMatch = content.match(/^#\s*@(\w+)\s+(.+)$/);
      if (metaMatch) {
        const [, key, value] = metaMatch;
        if (key === 'NAME') {
          nfa.name = value.trim();
        } else if (key === 'REGEX') {
          nfa.regex = value.trim();
        }
      }
      continue;
    }

    // Parse Transitionen im AEF-Format
    try {
      parseTransitionLine(content, nfa, number, stateMarkings);
      hasTransitions = true;
    } catch (error) {
      if (error instanceof DSLParseError) {
        throw error;
      }
      throw new DSLParseError(`Fehler beim Parsen der Zeile: ${content}`, number);
    }
  }

  // Validiere NFA
  if (!hasTransitions) {
    throw new DSLParseError('Keine Transitionen gefunden');
  }
  
  finalizeNFA(nfa);
  return nfa;
}

/**
 * Erstellt ein leeres NFA-Objekt
 */
function createEmptyNFA(): NFA {
  return {
    states: [],
    alphabet: [],
    startState: "",
    acceptStates: [],
    transitions: [],
    hasEpsilon: false
  };
}

/**
 * Parst eine Transitionszeile im AEF-Format mit strikten Validierungen
 * Beispiele:
 * - .q0 -1> q1 -0> q2 -1> q3;
 * - .q0 -A> -B> q0;
 * - q3 -ε> (q5);
 * 
 * Strikte Regeln:
 * - Zeile MUSS mit Semikolon (;) enden
 * - Startzustand wird mit . markiert (z.B. .q0) - einmalige Markierung reicht
 * - Endzustand wird in Klammern gesetzt (z.B. (q5)) - einmalige Markierung reicht
 * - Symbole MÜSSEN Format -symbol> haben (keine Leerzeichen)
 * - Tokens MÜSSEN durch Leerzeichen getrennt sein
 * - Nur ε für Epsilon erlaubt (nicht "epsilon")
 * - Nur EIN Startzustand im gesamten NFA erlaubt
 * - Ein Automat pro Datei
 */
function parseTransitionLine(
  line: string, 
  nfa: NFA, 
  lineNumber: number,
  stateMarkings: Map<string, { isStart: boolean; isAccept: boolean; firstLine: number }>
): void {
  // REGEL 1: Zeile MUSS mit Semikolon enden
  if (!line.endsWith(';')) {
    throw new DSLParseError(
      `Zeile muss mit Semikolon (;) enden. Gefunden: "${line}"`,
      lineNumber
    );
  }
  
  // Entferne Semikolon und trim
  line = line.slice(0, -1).trim();
  
  if (!line) {
    throw new DSLParseError(`Leere Zeile (nur Semikolon)`, lineNumber);
  }

  // REGEL 2: Prüfe auf ungültige Formate BEVOR wir tokenisieren
  validateLineFormat(line, lineNumber);

  // Tokenisiere mit Leerzeichen als Trenner
  const tokens = line.split(/\s+/).filter(t => t.length > 0);
  
  if (tokens.length === 0) {
    throw new DSLParseError(`Keine gültigen Tokens gefunden`, lineNumber);
  }

  let currentState: string | null = null;
  let pendingSymbols: string[] = [];
  let hasAnyTransition = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // REGEL 3: Prüfe Symbol-Format
    if (token.match(/^-[^>]+-?$/)) {
      throw new DSLParseError(
        `Ungültiges Symbol-Format: "${token}". Erwartet: -symbol> (keine Leerzeichen)`,
        lineNumber
      );
    }

    if (token.startsWith('-') && token.endsWith('>')) {
      // Dies ist ein Symbol
      const symbol = token.substring(1, token.length - 1);
      
      // REGEL 4: Prüfe auf leeres Symbol
      if (symbol.length === 0) {
        throw new DSLParseError(`Leeres Symbol gefunden: "->"`, lineNumber);
      }
      
      // REGEL 5: Prüfe auf Leerzeichen im Symbol
      if (symbol.includes(' ')) {
        throw new DSLParseError(
          `Symbol darf keine Leerzeichen enthalten: "${token}"`,
          lineNumber
        );
      }

      // REGEL 6: Nur ε erlaubt, nicht "epsilon"
      if (symbol === 'epsilon') {
        throw new DSLParseError(
          `Verwenden Sie 'ε' statt 'epsilon' für Epsilon-Übergänge`,
          lineNumber
        );
      }
      
      if (!currentState) {
        throw new DSLParseError(
          `Symbol '${symbol}' ohne Ausgangszustand gefunden`,
          lineNumber
        );
      }

      // Sammle Symbol
      pendingSymbols.push(symbol);
      hasAnyTransition = true;
      
      // Behandle Epsilon-Transitionen
      if (symbol === 'ε') {
        nfa.hasEpsilon = true;
      } else {
        // Füge Symbol zum Alphabet hinzu
        if (!nfa.alphabet.includes(symbol)) {
          nfa.alphabet.push(symbol);
        }
      }
    } else {
      // Dies ist ein Zustand
      const { stateName, isStart, isAccept } = parseStateToken(token, lineNumber);
      
      // REGEL 7: Merke Zustandsmarkierungen (einmalige Markierung reicht)
      const existing = stateMarkings.get(stateName);
      if (existing) {
        // Zustand wurde bereits verwendet - übernehme gespeicherte Markierungen
        // Wenn neue Markierungen gesetzt sind, werden sie übernommen
        if (isStart && !existing.isStart) {
          existing.isStart = true;
        }
        if (isAccept && !existing.isAccept) {
          existing.isAccept = true;
        }
      } else {
        // Erste Verwendung dieses Zustands - speichere Markierungen
        stateMarkings.set(stateName, {
          isStart,
          isAccept,
          firstLine: lineNumber
        });
      }
      
      // Nutze die globalen Markierungen (nicht die lokalen aus diesem Token)
      const globalMarkings = stateMarkings.get(stateName)!;
      const effectiveIsStart = globalMarkings.isStart;
      const effectiveIsAccept = globalMarkings.isAccept;
      
      // REGEL 8: Nur EIN Startzustand erlaubt
      if (effectiveIsStart) {
        if (nfa.startState && nfa.startState !== stateName) {
          throw new DSLParseError(
            `Mehrere Startzustände gefunden: "${nfa.startState}" und "${stateName}". Nur ein Startzustand ist erlaubt`,
            lineNumber
          );
        }
        nfa.startState = stateName;
      }

      // Füge Zustand hinzu, falls noch nicht vorhanden
      if (!nfa.states.includes(stateName)) {
        nfa.states.push(stateName);
      }

      // Füge zu akzeptierenden Zuständen hinzu
      if (effectiveIsAccept && !nfa.acceptStates.includes(stateName)) {
        nfa.acceptStates.push(stateName);
      }

      // Erstelle Transitionen für alle ausstehenden Symbole
      if (pendingSymbols.length > 0 && currentState) {
        for (const symbol of pendingSymbols) {
          const transition: Transition = {
            from: currentState,
            symbol: symbol,
            to: stateName
          };
          
          // Prüfe auf Duplikate
          const isDuplicate = nfa.transitions.some(
            t => t.from === transition.from && 
                 t.symbol === transition.symbol && 
                 t.to === transition.to
          );
          
          if (!isDuplicate) {
            nfa.transitions.push(transition);
          }
        }
        pendingSymbols = [];
      } else if (currentState) {
        // REGEL: Zwei aufeinanderfolgende Zustände ohne Symbol dazwischen sind ungültig
        throw new DSLParseError(
          `Zwei aufeinanderfolgende Zustände ohne Transition gefunden: "${currentState}" und "${stateName}". ` +
          `Erwarte Symbol zwischen Zuständen (z.B. ${currentState} -a> ${stateName})`,
          lineNumber
        );
      }

      // Aktueller Zustand wird zum neuen Ausgangszustand
      currentState = stateName;
    }
  }

  // REGEL 9: Zeile muss mindestens eine Transition enthalten
  if (!hasAnyTransition) {
    throw new DSLParseError(
      `Zeile enthält keine Transitionen. Erwartet: Zustand -symbol> Zustand`,
      lineNumber
    );
  }

  if (pendingSymbols.length > 0) {
    throw new DSLParseError(
      `Symbole ${pendingSymbols.join(', ')} ohne Zielzustand`,
      lineNumber
    );
  }
}

/**
 * Validiert das Format einer Zeile VOR dem Tokenisieren
 */
function validateLineFormat(line: string, lineNumber: number): void {
  // Prüfe auf ungültige Muster
  
  // -> (leeres Symbol)
  if (line.includes('->')) {
    throw new DSLParseError(
      `Ungültiges Format "->". Symbol darf nicht leer sein`,
      lineNumber
    );
  }
  
  // -Symbol (fehlendes >)
  const invalidSymbolPattern = /-[^\s>]+(?:\s|$)/;
  if (invalidSymbolPattern.test(line)) {
    throw new DSLParseError(
      `Ungültiges Symbol-Format gefunden. Erwartet: -symbol> (mit >)`,
      lineNumber
    );
  }
  
  // Symbol> (fehlendes -)
  const missingDashPattern = /(?:^|\s)[^-.\s(][^\s]*>/;
  if (missingDashPattern.test(line)) {
    throw new DSLParseError(
      `Ungültiges Symbol-Format gefunden. Symbol muss mit - beginnen: -symbol>`,
      lineNumber
    );
  }
}

/**
 * Parst ein Zustands-Token und validiert das Format
 * Unterstützte Formate:
 * - qi: normaler Zustand
 * - .qi: Startzustand
 * - (qi): Akzeptierzustand
 * - (.qi): Start- und Akzeptierzustand
 */
function parseStateToken(token: string, lineNumber: number): {
  stateName: string;
  isStart: boolean;
  isAccept: boolean;
} {
  let isStart = false;
  let isAccept = false;
  let stateName = token;
  
  // Prüfe auf Akzeptierzustand (Klammern)
  if (token.startsWith('(') && token.endsWith(')')) {
    isAccept = true;
    stateName = token.substring(1, token.length - 1);
    
    // Validiere Klammer-Format
    if (!stateName) {
      throw new DSLParseError(
        `Leerer Zustandsname in Klammern: "${token}"`,
        lineNumber
      );
    }
    
    // Prüfe auf Start-Notation innerhalb von Klammern: (.qi)
    if (stateName.startsWith('.')) {
      isStart = true;
      stateName = stateName.substring(1);
      
      if (!stateName) {
        throw new DSLParseError(
          `Leerer Zustandsname nach Punkt in Klammern: "${token}"`,
          lineNumber
        );
      }
    }
  } else if (token.startsWith('.')) {
    // .qi - Startzustand
    isStart = true;
    stateName = token.substring(1);
  }
  
  // REGEL: Zustandsname darf keine Leerzeichen enthalten
  if (stateName.includes(' ')) {
    throw new DSLParseError(
      `Zustandsname darf keine Leerzeichen enthalten: "${stateName}"`,
      lineNumber
    );
  }
  
  // REGEL: Zustandsname darf nicht leer sein
  if (stateName.length === 0) {
    throw new DSLParseError(
      `Leerer Zustandsname gefunden: "${token}"`,
      lineNumber
    );
  }
  
  // Prüfe auf ungültige Zeichen
  if (!stateName.match(/^[\w∅]+$/)) {
    throw new DSLParseError(
      `Ungültiger Zustandsname: "${stateName}". Erlaubt sind nur Buchstaben, Zahlen, Unterstriche und ∅`,
      lineNumber
    );
  }
  
  return { stateName, isStart, isAccept };
}

/**
 * Extrahiert alle Symbole aus einem regulären Ausdruck
 * Entfernt Operatoren wie *, +, |, (, ), .
 */
function extractSymbolsFromRegex(regex: string): string[] {
  // Entferne alle Regex-Operatoren und Meta-Zeichen
  const symbols = regex
    .replace(/[*+?|().[\]{}\\]/g, ' ')  // Ersetze Operatoren mit Leerzeichen
    .split(/\s+/)                         // Splitte bei Leerzeichen
    .filter(s => s.length > 0)            // Entferne leere Strings
    .flatMap(s => s.split(''))            // Splitte in einzelne Zeichen
    .filter(s => s !== 'ε');              // Entferne Epsilon
  
  // Dedupliziere und sortiere
  return [...new Set(symbols)].sort();
}

/**
 * Finalisiert ein NFA und validiert es
 */
function finalizeNFA(nfa: NFA): void {
  // REGEL 1: Mindestens ein Zustand erforderlich
  if (nfa.states.length === 0) {
    throw new DSLParseError('Keine Zustände definiert');
  }
  
  // REGEL 2: Genau EIN Startzustand erforderlich (nicht optional!)
  if (!nfa.startState) {
    throw new DSLParseError(
      'Kein Startzustand definiert. Markieren Sie einen Zustand mit . (z.B. .q0)'
    );
  }
  
  // REGEL 3: Mindestens ein akzeptierender Zustand erforderlich
  if (nfa.acceptStates.length === 0) {
    throw new DSLParseError(
      'Keine akzeptierenden Zustände definiert. Setzen Sie mindestens einen Zustand in Klammern (z.B. (q2))'
    );
  }

  // REGEL 4: Mindestens eine Transition erforderlich
  if (nfa.transitions.length === 0) {
    throw new DSLParseError('Keine Transitionen definiert');
  }

  // REGEL 4a: Wenn Regex definiert ist, validiere Symbole gegen Regex
  if (nfa.regex) {
    const regexSymbols = extractSymbolsFromRegex(nfa.regex);
    
    // Prüfe jedes Symbol im Alphabet
    for (const symbol of nfa.alphabet) {
      if (!regexSymbols.includes(symbol)) {
        throw new DSLParseError(
          `Symbol "${symbol}" wird in Transitionen verwendet, kommt aber nicht in der Regex vor. ` +
          `Regex: "${nfa.regex}" ` +
          `Erlaubte Symbole aus Regex: ${regexSymbols.length > 0 ? regexSymbols.join(', ') : '(keine)'}`
        );
      }
    }
  }

  // REGEL 5: Startzustand muss in der Zustandsliste sein
  if (!nfa.states.includes(nfa.startState)) {
    throw new DSLParseError(
      `Startzustand "${nfa.startState}" existiert nicht in der Zustandsliste`
    );
  }

  // REGEL 6: Alle akzeptierenden Zustände müssen existieren
  for (const acceptState of nfa.acceptStates) {
    if (!nfa.states.includes(acceptState)) {
      throw new DSLParseError(
        `Akzeptierender Zustand "${acceptState}" existiert nicht in der Zustandsliste`
      );
    }
  }

  // REGEL 7: Alle Transitionen müssen gültige Zustände referenzieren
  for (const transition of nfa.transitions) {
    if (!nfa.states.includes(transition.from)) {
      throw new DSLParseError(
        `Transition verwendet unbekannten Zustand: "${transition.from}"`
      );
    }
    if (!nfa.states.includes(transition.to)) {
      throw new DSLParseError(
        `Transition verwendet unbekannten Zustand: "${transition.to}"`
      );
    }
  }

  // REGEL 8: Alle Symbole in Transitionen müssen im Alphabet sein (außer Epsilon)
  for (const transition of nfa.transitions) {
    if (transition.symbol !== 'ε' && !nfa.alphabet.includes(transition.symbol)) {
      throw new DSLParseError(
        `Transition verwendet Symbol "${transition.symbol}", das nicht im Alphabet definiert ist. ` +
        `Verfügbare Symbole: ${nfa.alphabet.length > 0 ? nfa.alphabet.join(', ') : '(leer)'}`
      );
    }
  }

  // Sortiere Arrays für Konsistenz
  nfa.states.sort();
  nfa.alphabet.sort();
  nfa.acceptStates.sort();
}