import { describe, it, expect } from 'vitest';
import { parseDSL } from '../src/core/parser/dslParser';

describe('Example1_NFA_1a - Transition Verification', () => {
  const input = `# @NAME Example1_NFA_1a
# @REGEX (1.(0.1)+)|(0.0)

.q0 -1> q1 -0> q2 -1> q3 -0> q4;
q3 -ε> (q5);
.q0 -0> q6 -0> (q5);
q4 -1> q3;`;

  it('sollte erfolgreich parsen', () => {
    const result = parseDSL(input);
    
    expect(result.success).toBe(true);
  });

  it('sollte korrekte Metadaten haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.name).toBe('Example1_NFA_1a');
      expect(result.nfa?.regex).toBe('(1.(0.1)+)|(0.0)');
    }
  });

  it('sollte korrekten Startzustand haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.startState).toBe('q0');
    }
  });

  it('sollte korrekte Endzustände haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.acceptStates).toContain('q5');
      expect(result.nfa?.acceptStates).toHaveLength(1);
    }
  });

  it('sollte alle Zustände haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.states).toContain('q0');
      expect(result.nfa?.states).toContain('q1');
      expect(result.nfa?.states).toContain('q2');
      expect(result.nfa?.states).toContain('q3');
      expect(result.nfa?.states).toContain('q4');
      expect(result.nfa?.states).toContain('q5');
      expect(result.nfa?.states).toContain('q6');
      expect(result.nfa?.states).toHaveLength(7);
    }
  });

  it('sollte korrektes Alphabet haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.alphabet).toContain('0');
      expect(result.nfa?.alphabet).toContain('1');
      expect(result.nfa?.alphabet).toHaveLength(2);
    }
  });

  it('sollte Epsilon-Transitionen erkennen', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.hasEpsilon).toBe(true);
    }
  });

  it('sollte korrekte Anzahl von Transitionen haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      expect(result.nfa?.transitions).toHaveLength(8);
    }
  });

  it('sollte alle Transitionen korrekt parsen', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      const transitions = result.nfa?.transitions;
      
      // Zeile 1: .q0 -1> q1 -0> q2 -1> q3 -0> q4;
      expect(transitions).toContainEqual({ from: 'q0', symbol: '1', to: 'q1' });
      expect(transitions).toContainEqual({ from: 'q1', symbol: '0', to: 'q2' });
      expect(transitions).toContainEqual({ from: 'q2', symbol: '1', to: 'q3' });
      expect(transitions).toContainEqual({ from: 'q3', symbol: '0', to: 'q4' });
      
      // Zeile 2: q3 -ε> (q5);
      expect(transitions).toContainEqual({ from: 'q3', symbol: 'ε', to: 'q5' });
      
      // Zeile 3: .q0 -0> q6 -0> (q5);
      expect(transitions).toContainEqual({ from: 'q0', symbol: '0', to: 'q6' });
      expect(transitions).toContainEqual({ from: 'q6', symbol: '0', to: 'q5' });
      
      // Zeile 4: q4 -1> q3;
      expect(transitions).toContainEqual({ from: 'q4', symbol: '1', to: 'q3' });
    }
  });

  it('sollte Transitionen von q0 korrekt haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      const q0Transitions = result.nfa?.transitions.filter(t => t.from === 'q0');
      
      expect(q0Transitions).toHaveLength(2);
      expect(q0Transitions).toContainEqual({ from: 'q0', symbol: '1', to: 'q1' });
      expect(q0Transitions).toContainEqual({ from: 'q0', symbol: '0', to: 'q6' });
    }
  });

  it('sollte Transitionen zu q5 korrekt haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      const toQ5Transitions = result.nfa?.transitions.filter(t => t.to === 'q5');
      
      expect(toQ5Transitions).toHaveLength(2);
      expect(toQ5Transitions).toContainEqual({ from: 'q3', symbol: 'ε', to: 'q5' });
      expect(toQ5Transitions).toContainEqual({ from: 'q6', symbol: '0', to: 'q5' });
    }
  });

  it('sollte Schleife q4 -> q3 korrekt haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      const q4ToQ3 = result.nfa?.transitions.find(
        t => t.from === 'q4' && t.to === 'q3'
      );
      
      expect(q4ToQ3).toBeDefined();
      expect(q4ToQ3?.symbol).toBe('1');
    }
  });

  it('sollte verkettete Transitionen in Zeile 1 korrekt haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      // Überprüfe die Kette: q0 -> q1 -> q2 -> q3 -> q4
      const chain = [
        { from: 'q0', symbol: '1', to: 'q1' },
        { from: 'q1', symbol: '0', to: 'q2' },
        { from: 'q2', symbol: '1', to: 'q3' },
        { from: 'q3', symbol: '0', to: 'q4' }
      ];
      
      chain.forEach(transition => {
        expect(result.nfa?.transitions).toContainEqual(transition);
      });
    }
  });

  it('sollte verkettete Transitionen in Zeile 3 korrekt haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      // Überprüfe die Kette: q0 -> q6 -> q5
      const chain = [
        { from: 'q0', symbol: '0', to: 'q6' },
        { from: 'q6', symbol: '0', to: 'q5' }
      ];
      
      chain.forEach(transition => {
        expect(result.nfa?.transitions).toContainEqual(transition);
      });
    }
  });

  it('sollte q3 als Verzweigungspunkt haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      // q3 hat zwei ausgehende Transitionen: -0> q4 und -ε> q5
      const q3Transitions = result.nfa?.transitions.filter(t => t.from === 'q3');
      
      expect(q3Transitions).toHaveLength(2);
      expect(q3Transitions?.some(t => t.symbol === '0' && t.to === 'q4')).toBe(true);
      expect(q3Transitions?.some(t => t.symbol === 'ε' && t.to === 'q5')).toBe(true);
    }
  });

  it('sollte keine doppelten Transitionen haben', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      const transitions = result.nfa?.transitions;
      const transitionStrings = transitions?.map(
        t => `${t.from}-${t.symbol}>${t.to}`
      );
      
      const uniqueTransitions = new Set(transitionStrings);
      expect(uniqueTransitions.size).toBe(transitions?.length);
    }
  });

  it('sollte vollständige NFA-Struktur validieren', () => {
    const result = parseDSL(input);
    
    if (result.success) {
      const nfa = result.nfa;
      
      // Validiere, dass alle Transitionen gültige Zustände verwenden
      nfa?.transitions.forEach(t => {
        expect(nfa.states).toContain(t.from);
        expect(nfa.states).toContain(t.to);
      });
      
      // Validiere, dass der Startzustand existiert
      expect(nfa?.states).toContain(nfa?.startState);
      
      // Validiere, dass alle Endzustände existieren
      nfa?.acceptStates.forEach(state => {
        expect(nfa?.states).toContain(state);
      });
      
      // Validiere, dass alle Symbole (außer ε) im Alphabet sind
      nfa?.transitions.forEach(t => {
        if (t.symbol !== 'ε') {
          expect(nfa?.alphabet).toContain(t.symbol);
        }
      });
    }
  });
});
