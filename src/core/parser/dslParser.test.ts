import { describe, it, expect } from 'vitest';
import { parseDSL } from './dslParser';
import type { NFA } from '../models/types';

// Helper function to assert successful parse result
function assertSuccess(result: ReturnType<typeof parseDSL>): asserts result is { success: true; nfa: NFA } {
  if (!result.success || !result.nfa) {
    throw new Error(`Parse failed: ${result.success ? 'No NFA' : result.error}`);
  }
}

describe('dslParser', () => {
  describe('parseDSL - Basic Parsing', () => {
    it('should parse simple NFA with metadata', () => {
      const input = `# @NAME TestNFA
# @REGEX a*b

.q0 -a> q1 -b> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.name).toBe('TestNFA');
      expect(result.nfa.regex).toBe('a*b');
      expect(result.nfa.startState).toBe('q0');
      expect(result.nfa.acceptStates).toContain('q2');
    });

    it('should parse NFA without metadata', () => {
      const input = `.q0 -a> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.states).toContain('q0');
      expect(result.nfa.states).toContain('q1');
    });

    it('should handle comments', () => {
      const input = `# This is a comment
.q0 -a> (q1);
# Another comment`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
    });
  });

  describe('parseDSL - Epsilon Transitions', () => {
    it('should parse epsilon transitions with ε', () => {
      const input = `.q0 -ε> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.hasEpsilon).toBe(true);
      expect(result.nfa.transitions).toContainEqual({
        from: 'q0',
        symbol: 'ε',
        to: 'q1'
      });
    });

    it('should reject epsilon keyword', () => {
      const input = `.q0 -epsilon> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('epsilon');
    });
  });

  describe('parseDSL - Chained Transitions', () => {
    it('should parse chained transitions', () => {
      const input = `.q0 -a> q1 -b> q2 -c> (q3);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.transitions).toHaveLength(3);
      expect(result.nfa.transitions).toContainEqual({ from: 'q0', symbol: 'a', to: 'q1' });
      expect(result.nfa.transitions).toContainEqual({ from: 'q1', symbol: 'b', to: 'q2' });
      expect(result.nfa.transitions).toContainEqual({ from: 'q2', symbol: 'c', to: 'q3' });
    });

    it('should parse multiple symbols from same state', () => {
      const input = `.q0 -a> -b> q1 -c> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      const q0Transitions = result.nfa.transitions.filter(t => t.from === 'q0');
      expect(q0Transitions).toHaveLength(2);
      expect(q0Transitions).toContainEqual({ from: 'q0', symbol: 'a', to: 'q1' });
      expect(q0Transitions).toContainEqual({ from: 'q0', symbol: 'b', to: 'q1' });
    });
  });

  describe('parseDSL - State Notations', () => {
    it('should parse start state with dot', () => {
      const input = `.q0 -a> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.startState).toBe('q0');
    });

    it('should parse accept state with parentheses', () => {
      const input = `.q0 -a> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.acceptStates).toContain('q1');
    });

    it('should parse combined start and accept state', () => {
      const input = `(.q0) -a> q1;`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.startState).toBe('q0');
      expect(result.nfa.acceptStates).toContain('q0');
    });
  });

  describe('parseDSL - Validation Rules', () => {
    it('should require semicolon at end of line', () => {
      const input = `.q0 -a> (q1)`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Semikolon');
    });

    it('should require at least one start state', () => {
      const input = `q0 -a> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Startzustand');
    });

    it('should reject multiple start states', () => {
      const input = `.q0 -a> q1;
.q2 -b> (q3);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mehrere Startzustände');
    });

    it('should require at least one accept state', () => {
      const input = `.q0 -a> q1;`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akzeptierend');
    });

    it('should reject empty arrow format', () => {
      const input = `.q0 -> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('->');
    });
  });

  describe('parseDSL - Flexible State Notation', () => {
    it('should allow state without marking after initial marking with dot', () => {
      const input = `.q0 -a> q1;
q0 -b> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.startState).toBe('q0');
      expect(result.nfa.states).toContain('q0');
    });

    it('should allow state without parentheses after initial accept marking', () => {
      const input = `.q0 -a> (q1);
q1 -b> q2;`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.acceptStates).toContain('q1');
    });

    it('should recognize start state from any occurrence with dot', () => {
      const input = `q0 -a> q1;
.q0 -b> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.startState).toBe('q0');
    });

    it('should recognize accept state from any occurrence with parentheses', () => {
      const input = `.q0 -a> q1;
q1 -b> q2;
q0 -c> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.acceptStates).toContain('q1');
    });
  });

  describe('parseDSL - Duplicate Handling', () => {
    it('should deduplicate identical transitions', () => {
      const input = `.q0 -a> q1;
.q0 -a> q1;
q1 -b> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.transitions).toHaveLength(2);
      const q0ToQ1 = result.nfa.transitions.filter(
        t => t.from === 'q0' && t.symbol === 'a' && t.to === 'q1'
      );
      expect(q0ToQ1).toHaveLength(1);
    });
  });

  describe('parseDSL - Space Validation', () => {
    it('should reject consecutive states without symbol', () => {
      const input = `.q 0 -a> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Zwei aufeinanderfolgende Zustände');
    });
  });

  describe('parseDSL - Alphabet Extraction', () => {
    it('should extract alphabet from transitions', () => {
      const input = `.q0 -a> q1 -b> q2 -c> (q3);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.alphabet).toContain('a');
      expect(result.nfa.alphabet).toContain('b');
      expect(result.nfa.alphabet).toContain('c');
      expect(result.nfa.alphabet).toHaveLength(3);
    });

    it('should not include epsilon in alphabet', () => {
      const input = `.q0 -a> q1 -ε> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.alphabet).toContain('a');
      expect(result.nfa.alphabet).not.toContain('ε');
    });
  });

  describe('parseDSL - Error Reporting', () => {
    it('should include line number in error', () => {
      const input = `.q0 -a> q1;
q2 -b> q3`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.line).toBeDefined();
    });

    it('should provide descriptive error messages', () => {
      const input = `.q0 -a> q1`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error!.length).toBeGreaterThan(10);
    });
  });

  describe('parseDSL - Empty State Symbol', () => {
    it('should handle empty state symbol ∅', () => {
      const input = `.q0 -a> q∅ -b> (q1);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.states).toContain('q∅');
    });
  });

  describe('parseDSL - Complex Real-World Examples', () => {
    it('should parse Example_NFA', () => {
      const input = `# @NAME Example_NFA
# @REGEX (1.(0.1)+)|(0.0)

.q0 -1> q1 -0> q2 -1> q3 -0> q4;
q3 -ε> (q5);
.q0 -0> q6 -0> (q5);
q4 -1> q3;`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.states).toHaveLength(7);
      expect(result.nfa.transitions).toHaveLength(8);
      expect(result.nfa.hasEpsilon).toBe(true);
    });
  });

  describe('parseDSL - Regex Symbol Validation', () => {
    it('should accept symbols that are in regex', () => {
      const input = `# @NAME Test
# @REGEX (a|b)*c

.q0 -a> q1 -b> q2 -c> (q3);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.alphabet).toEqual(['a', 'b', 'c']);
    });

    it('should reject symbol not in regex', () => {
      const input = `# @NAME Test
# @REGEX (a|b)*

.q0 -a> q1 -x> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Symbol "x"');
      expect(result.error).toContain('kommt aber nicht in der Regex vor');
      expect(result.error).toContain('(a|b)*');
    });

    it('should work without regex defined', () => {
      const input = `.q0 -a> q1 -b> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.alphabet).toEqual(['a', 'b']);
    });

    it('should ignore epsilon in regex validation', () => {
      const input = `# @NAME Test
# @REGEX a*b

.q0 -a> q1 -ε> q2 -b> (q3);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.hasEpsilon).toBe(true);
    });

    it('should extract symbols from complex regex', () => {
      const input = `# @NAME Test
# @REGEX (1.(0.1)+)|(0.0)

.q0 -1> q1 -0> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.alphabet).toEqual(['0', '1']);
    });

    it('should handle regex with special characters', () => {
      const input = `# @NAME Test
# @REGEX [a-z]+

.q0 -a> q1 -z> (q2);`;

      const result = parseDSL(input);

      expect(result.success).toBe(true);
      assertSuccess(result);
      expect(result.nfa.alphabet).toEqual(['a', 'z']);
    });

    it('should reject when multiple symbols are wrong', () => {
      const input = `# @NAME Test
# @REGEX a*

.q0 -a> q1 -b> q2 -c> (q3);`;

      const result = parseDSL(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Symbol "b"');
      expect(result.error).toContain('kommt aber nicht in der Regex vor');
    });
  });
});
