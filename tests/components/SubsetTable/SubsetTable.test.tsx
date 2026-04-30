import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SubsetTable from '@/components/SubsetTable/SubsetTable';
import type { SubsetConstructionStep } from '@/core/algorithm/subsetConstruction';

vi.mock('@tolgee/react', () => ({
  useTranslate: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'table.title': 'Übergangstabelle',
        'table.headers.state': 'Zustand',
        'table.headers.status': 'Status',
        'table.current': 'aktuell',
        'table.status.marked': 'markiert',
        'table.status.unmarked': 'unmarkiert',
        'table.empty': '—',
        'table.legend.currentState': 'Aktueller Zustand',
        'table.legend.currentTransition': 'Aktuelle Transition',
        'table.legend.unmarked': 'Unmarkiert',
        'table.legend.marked': 'Markiert',
      };
      const template = translations[key] ?? key;
      if (params) {
        return Object.entries(params).reduce(
          (str, [k, v]) => str.replace(`{${k}}`, v),
          template
        );
      }
      return template;
    },
  }),
}));

const createMockStep = (overrides?: Partial<SubsetConstructionStep>): SubsetConstructionStep => ({
  stepNumber: 0,
  description: 'Test step',
  currentState: ['q0'],
  currentStateString: 'q0',
  isNewState: false,
  dfaStates: [['q0']],
  dfaTransitions: [],
  unmarkedStates: [],
  markedStates: [['q0']],
  isComplete: false,
  ...overrides,
});

describe('SubsetTable', () => {
  afterEach(() => {
    cleanup();
  });
  
  it('should render table header with alphabet', () => {
    const step = createMockStep();
    const alphabet = ['a', 'b', 'c'];

    render(<SubsetTable step={step} alphabet={alphabet} />);
    
    expect(screen.getByText('Übergangstabelle')).toBeInTheDocument();
    expect(screen.getByText('Zustand')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getAllByText('a').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('b').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('c').length).toBeGreaterThanOrEqual(1);
  });

  it('should display single state', () => {
    const step = createMockStep({
      dfaStates: [['q0']],
      currentState: ['q0'],
      markedStates: [['q0']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText('q0').length).toBeGreaterThanOrEqual(1);
  });

  it('should display composite state with curly braces', () => {
    const step = createMockStep({
      dfaStates: [['q0', 'q1']],
      currentState: ['q0', 'q1'],
      markedStates: [['q0', 'q1']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText('q0_q1').length).toBeGreaterThanOrEqual(1);
  });

  it('should display empty state as ∅', () => {
    const step = createMockStep({
      dfaStates: [[]],
      currentState: [],
      markedStates: [[]],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText('∅').length).toBeGreaterThanOrEqual(1);
  });

  it('should show marked status', () => {
    const step = createMockStep({
      dfaStates: [['q0']],
      currentState: [],
      markedStates: [['q0']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText(/✓ markiert/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should show unmarked status', () => {
    const step = createMockStep({
      dfaStates: [['q0']],
      currentState: ['q0'],
      markedStates: [],
      unmarkedStates: [['q0']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText(/○ unmarkiert/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should highlight current state', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q1']],
      currentState: ['q1'],
      markedStates: [['q0']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText(/← aktuell/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should display transitions', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q1']],
      currentState: ['q0'],
      markedStates: [['q0']],
      dfaTransitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
      ],
    });

    render(<SubsetTable step={step} alphabet={['a', 'b']} />);
    
    expect(screen.getAllByText('q1').length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty cell for missing transitions', () => {
    const step = createMockStep({
      dfaStates: [['q0']],
      currentState: ['q0'],
      markedStates: [['q0']],
      dfaTransitions: [],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('should highlight current transition with lightning bolt', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q1']],
      currentState: ['q0'],
      symbol: 'a',
      markedStates: [['q0']],
      dfaTransitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
      ],
    });

    render(<SubsetTable step={step} alphabet={['a', 'b']} />);
    
    expect(screen.getAllByText('⚡').length).toBeGreaterThanOrEqual(1);
  });

  it('should display multiple states in order', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q1'], ['q2']],
      currentState: ['q1'],
      markedStates: [['q0'], ['q2']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText('q0')[0]).toBeInTheDocument();
    expect(screen.getAllByText('q1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('q2')[0]).toBeInTheDocument();
  });

  it('should display multiple transitions for same state', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q1'], ['q2']],
      currentState: ['q0'],
      markedStates: [['q0'], ['q1'], ['q2']],
      dfaTransitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q2' },
      ],
    });

    render(<SubsetTable step={step} alphabet={['a', 'b']} />);
    
    expect(screen.getAllByText('q1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('q2').length).toBeGreaterThanOrEqual(1);
  });

  it('should render legend', () => {
    const step = createMockStep();

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    const legendItems = screen.getAllByText(/aktueller zustand|aktuelle transition|unmarkiert|markiert/i);
    expect(legendItems.length).toBeGreaterThan(0);
  });

  it('should handle complex composite states', () => {
    const step = createMockStep({
      dfaStates: [['q0', 'q1', 'q2']],
      currentState: ['q0', 'q1', 'q2'],
      markedStates: [['q0', 'q1', 'q2']],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    expect(screen.getAllByText('q0_q1_q2').length).toBeGreaterThanOrEqual(1);
  });

  it('should handle transitions between composite states', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q0', 'q1']],
      currentState: ['q0'],
      markedStates: [['q0']],
      dfaTransitions: [
        { from: 'q0', symbol: 'a', to: 'q0_q1' },
      ],
    });

    render(<SubsetTable step={step} alphabet={['a']} />);
    
    const compositeStates = screen.getAllByText('q0_q1');
    expect(compositeStates.length).toBeGreaterThanOrEqual(1);
  });

  it('should not highlight non-current transitions', () => {
    const step = createMockStep({
      dfaStates: [['q0'], ['q1']],
      currentState: ['q0'],
      symbol: undefined, // No current symbol selected
      markedStates: [['q0'], ['q1']],
      dfaTransitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
      ],
    });

    render(<SubsetTable step={step} alphabet={['a', 'b']} />);
    
    // Lightning bolt should not appear because no symbol is currently being processed
    const cells = screen.queryAllByText('⚡');
    expect(cells.length).toBe(0);
  });
});
