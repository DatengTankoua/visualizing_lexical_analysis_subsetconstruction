import { describe, it, expect } from 'vitest';
import { convertNFAtoDFA, convertNFAtoDFAWithSteps } from '@/core/algorithm/subsetConstruction';
import type { NFA } from '@/core/models/types';

describe('subsetConstruction', () => {
  describe('convertNFAtoDFA', () => {
    it('should convert simple NFA to DFA', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const dfa = convertNFAtoDFA(nfa);

      expect(dfa.states).toBeDefined();
      expect(dfa.startState).toBeDefined();
      expect(dfa.acceptStates).toBeDefined();
      expect(dfa.transitions).toBeDefined();
    });

    it('should handle NFA with epsilon transitions', () => {
      const nfa: NFA = {
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a', 'ε'],
        startState: 'q0',
        acceptStates: ['q2'],
        hasEpsilon: true,
        transitions: [
          { from: 'q0', symbol: 'ε', to: 'q1' },
          { from: 'q1', symbol: 'a', to: 'q2' },
        ],
      };

      const dfa = convertNFAtoDFA(nfa);

      expect(dfa.alphabet).not.toContain('ε');
      expect(dfa.states.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle NFA with multiple transitions on same symbol', () => {
      const nfa: NFA = {
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q2'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
          { from: 'q0', symbol: 'a', to: 'q2' },
        ],
      };

      const dfa = convertNFAtoDFA(nfa);

      expect(dfa.states).toBeDefined();
      expect(dfa.transitions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle NFA with no transitions', () => {
      const nfa: NFA = {
        states: ['q0'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q0'],
        transitions: [],
      };

      const dfa = convertNFAtoDFA(nfa);

      expect(dfa.states).toHaveLength(1);
      expect(dfa.startState).toBe('q0');
    });

    it('should set accept states correctly', () => {
      const nfa: NFA = {
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a', 'b'],
        startState: 'q0',
        acceptStates: ['q2'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
          { from: 'q1', symbol: 'b', to: 'q2' },
        ],
      };

      const dfa = convertNFAtoDFA(nfa);

      expect(dfa.acceptStates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('convertNFAtoDFAWithSteps', () => {
    it('should return DFA and steps', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      expect(result.dfa).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should create initialization step', () => {
      const nfa: NFA = {
        states: ['q0'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q0'],
        transitions: [],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      expect(result.steps[0]).toBeDefined();
      expect(result.steps[0].description).toContain('Initialization');
      expect(result.steps[0].stepNumber).toBe(0);
    });

    it('should record epsilon closure steps', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['ε'],
        startState: 'q0',
        acceptStates: ['q1'],
        hasEpsilon: true,
        transitions: [
          { from: 'q0', symbol: 'ε', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      const epsilonSteps = result.steps.filter(s => 
        s.description.includes('ε-closure')
      );
      expect(epsilonSteps.length).toBeGreaterThan(0);
    });

    it('should record move operations', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      const moveSteps = result.steps.filter(s => 
        s.description.includes('move(')
      );
      expect(moveSteps.length).toBeGreaterThan(0);
    });

    it('should mark new states', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      const newStateSteps = result.steps.filter(s => s.isNewState);
      expect(newStateSteps.length).toBeGreaterThan(0);
    });

    it('should record transitions', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      const transitionSteps = result.steps.filter(s => 
        s.description.includes('Transition added')
      );
      expect(transitionSteps.length).toBeGreaterThan(0);
    });

    it('should have completion step', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      const lastStep = result.steps[result.steps.length - 1];
      expect(lastStep.isComplete).toBe(true);
      expect(lastStep.description).toContain('Done');
    });

    it('should track marked and unmarked states', () => {
      const nfa: NFA = {
        states: ['q0', 'q1'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q1'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      result.steps.forEach(step => {
        expect(step.markedStates).toBeDefined();
        expect(step.unmarkedStates).toBeDefined();
        expect(Array.isArray(step.markedStates)).toBe(true);
        expect(Array.isArray(step.unmarkedStates)).toBe(true);
      });
    });

    it('should handle complex NFA with multiple paths', () => {
      const nfa: NFA = {
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a', 'b'],
        startState: 'q0',
        acceptStates: ['q2'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
          { from: 'q0', symbol: 'b', to: 'q2' },
          { from: 'q1', symbol: 'b', to: 'q2' },
        ],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      expect(result.steps.length).toBeGreaterThan(5);
      expect(result.dfa.states.length).toBeGreaterThanOrEqual(1);
    });

    it('should preserve NFA name in DFA', () => {
      const nfa: NFA = {
        name: 'TestNFA',
        states: ['q0'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q0'],
        transitions: [],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      expect(result.dfa.name).toBe('TestNFA_DFA');
    });

    it('should preserve regex in DFA', () => {
      const nfa: NFA = {
        regex: 'a*',
        states: ['q0'],
        alphabet: ['a'],
        startState: 'q0',
        acceptStates: ['q0'],
        transitions: [],
      };

      const result = convertNFAtoDFAWithSteps(nfa);

      expect(result.dfa.regex).toBe('a*');
    });
  });
});
