# Entwicklerdokumentation

**Anwendung:** NFA/DFA Visualizer  
**Version:** 1.0.0  
**Zielgruppe:** Entwickler, Maintainer, Contributors

---

## 1. Technische Übersicht

### 1.1 Technology Stack

```json
{
  "frontend": {
    "framework": "React 19.1.1",
    "language": "TypeScript 5.9.3",
    "buildTool": "Vite 7.1.7",
    "styling": "TailwindCSS 4.1.16"
  },
  "visualization": {
    "graphs": "ReactFlow 11.11.4",
    "layout": "Dagre 0.8.5"
  },
  "testing": {
    "framework": "Vitest 2.1.9",
    "library": "@testing-library/react 16.3.1",
    "coverage": "@vitest/coverage-v8 2.1.9"
  }
}
```

### 1.2 Setup

```bash
# Installation
npm install

# Development Server
npm run dev

# Tests
npm test

# Coverage
npm test -- --coverage --run
```

---

## 2. Projektstruktur

```
src/
├── components/              # React UI Components
│   ├── FileInput/
│   │   ├── DSLInput.tsx             # File Upload
│   │   └── DSLInput.test.tsx        # 45 Tests
│   ├── GraphViewer/
│   │   ├── GraphViewer.tsx          # ReactFlow Integration
│   │   └── GraphViewer.test.tsx     # 31 Tests
│   ├── Controls/
│   │   ├── StepControls.tsx         # Navigation
│   │   └── StepControls.test.tsx    # 14 Tests
│   └── SubsetTable/
│       ├── SubsetTable.tsx          # DFA Table
│       └── SubsetTable.test.tsx     # 16 Tests
│
├── core/                    # Business Logic
│   ├── parser/
│   │   ├── dslParser.ts             # AEF Parser
│   │   └── dslParser.test.ts        # 102 Tests
│   ├── algorithm/
│   │   ├── subsetConstruction.ts    # NFA→DFA
│   │   └── subsetConstruction.test.ts # 16 Tests
│   └── models/
│       └── types.ts                 # TypeScript Interfaces
│
├── pages/
│   └── Home.tsx                     # Main Page
├── utils/
│   └── helpers.ts
└── main.tsx                         # Entry Point
```

---

## 3. Architektur

### 3.1 Datenfluss

```
    DSL Input (AEF)
         │
         ↓
    ┌──────────┐
    │ dslParser│
    └────┬─────┘
         │ NFA
         ↓
  ┌──────────────┐
  │ Subset       │
  │Construction  │
  └──────┬───────┘
         │ DFA
         ↓
  ┌──────────────┐
  │ GraphViewer  │
  │ (Compare)    │
  └──────────────┘
```

---

## 4. Kern-Module

### 4.1 dslParser.ts

**Verantwortlichkeit:** AEF-Format → NFA-Objekt

**Hauptfunktionen:**
```typescript
// Haupt-Entry-Point
function parseDSL(input: string): ParseResult

// Interne Funktionen
function parseAEFFormat(lines: string[]): NFA
function parseTransitionLine(line: string, lineNum: number): ParsedLine
function parseStateToken(token: string): StateInfo
function validateLineFormat(line: string, lineNum: number): void
function finalizeNFA(states, transitions, ...): NFA
```

**Validierungsregeln:**
1. Zeilen müssen mit `;` enden
2. Genau ein Startzustand (`.`) - einmalige Markierung reicht
3. Mindestens ein Akzeptierender Zustand `()` - einmalige Markierung reicht
4. Korrekte Pfeil-Syntax `-symbol>`
5. Keine Leerzeichen in Zustandsnamen
6. Valide Epsilon-Symbole (nur `ε`)
7. Ein Automat pro Datei

**Beispiel-Nutzung:**
```typescript
import { parseDSL } from './core/parser/dslParser';

const input = `.q0 -a> (q1);`;
const result = parseDSL(input);

if (result.success) {
  console.log(result.nfa);
} else {
  console.error(result.error);
}
```

### 4.2 GraphViewer.tsx

**Verantwortlichkeit:** NFA/DFA Visualisierung

**Props:**
```typescript
interface GraphViewerProps {
  nfa?: NFA;
  dfa?: DFA;
  interactive?: boolean;
}
```

**Interne Funktionen:**
```typescript
// Layout-Berechnung
function layoutWithDagre(
  states: string[],
  transitions: Transition[]
): Map<string, Position>

// Node-Erstellung
function createNodes(nfa: NFA, positions: Map): Node[]

// Edge-Erstellung mit Styling
function createEdges(transitions: Transition[]): Edge[]
```

**Beispiel-Nutzung:**
```typescript
<GraphViewer
  nfa={myNFA}
  interactive={true}
/>
```

### 4.3 DSLInput.tsx

**Verantwortlichkeit:** Eingabe und Laden von NFA-Definitionen

**Props:**
```typescript
interface Props {
  onLoad: (text: string) => void;
  onParseResult: (result: ParseResult) => void;
}
```

**State:**
```typescript
const [text, setText] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [selectedExample, setSelectedExample] = useState("");
```

**Beispiel-Nutzung:**
```typescript
<DSLInput
  onLoad={(text) => {
    const result = parseDSL(text);
    setNFA(result.nfa);
  }}
  onParseResult={(result) => {
    if (!result.success) {
      showError(result.error);
    }
  }}
/>
```

---

## 5. TypeScript-Typen

### 5.1 Kern-Typen

```typescript
// types.ts
interface NFA {
  name?: string;
  regex?: string;
  states: string[];
  startState: string;
  acceptStates: string[];
  alphabet: string[];
  transitions: Transition[];
  hasEpsilon: boolean;
}

interface DFA {
  name?: string;
  regex?: string;
  states: string[];        // Potenzmengen
  startState: string;
  acceptStates: string[];
  alphabet: string[];
  transitions: Transition[];
}

interface Transition {
  from: string;
  to: string;
  symbol: string;
}

type ParseResult =
  | { success: true; nfa: NFA }
  | { success: false; error: string };
```

### 5.2 Interne Parser-Typen

```typescript
interface StateInfo {
  name: string;
  isStart: boolean;
  isAccept: boolean;
}

interface ParsedLine {
  states: StateInfo[];
  symbols: string[];
}
```

**Wichtig:** Der Parser merkt sich Zustandsmarkierungen:
- `.q0` einmal → `q0` ist überall Startzustand
- `(q3)` einmal → `q3` ist überall Akzeptierend

---

## 6. Testing

### 6.1 Test-Struktur

```
tests/
├── Unit Tests
│   ├── dslParser.test.ts              # Parser-Logik
│   ├── strict-validation.test.ts      # Validierungsregeln
│   └── consistency-validation.test.ts
│
└── Component Tests
    ├── DSLInput.test.tsx              # UI-Komponente
    └── GraphViewer.test.tsx           # Visualisierung

src/
└── Component Tests (co-located)
    ├── core/parser/dslParser.test.ts
    ├── components/FileInput/DSLInput.test.tsx
    └── components/GraphViewer/GraphViewer.test.tsx
```

### 6.2 Tests ausführen

```bash
# Alle Tests
npm test

# Mit Watch-Mode
npm test -- --watch

# Spezifische Datei
npm test -- dslParser.test.ts

# Coverage-Report
npm run test:coverage

# UI für Tests
npm run test:ui
```

### 6.3 Test-Beispiel

```typescript
import { describe, it, expect } from 'vitest';
import { parseDSL } from './dslParser';

describe('dslParser', () => {
  it('should parse simple NFA', () => {
    const input = `.q0 -a> (q1);`;
    const result = parseDSL(input);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.nfa.states).toEqual(['q0', 'q1']);
      expect(result.nfa.startState).toBe('q0');
      expect(result.nfa.acceptStates).toContain('q1');
    }
  });
});
```

### 6.4 Mocking

**ReactFlow mocken:**
```typescript
vi.mock('reactflow', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="reactflow">
      {props.children}
    </div>
  ),
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  // ...
}));
```

**Dagre mocken:**
```typescript
const mockNodePositions = new Map();

vi.mock('dagre', () => ({
  __esModule: true,
  default: {
    graphlib: { Graph: MockGraphClass },
    layout: vi.fn(),
  },
}));
```

---

## 7. Build & Deployment

### 7.1 Development Build

```bash
# Dev-Server mit HMR
npm run dev

# Typ-Checking
npm run build    # tsc -b && vite build
```

### 7.2 Production Build

```bash
# Build für Production
npm run build

# Output: dist/
#   → index.html
#   → assets/*.js
#   → assets/*.css
```

### 7.3 Build testen

```bash
# Preview des Production Builds
npm run preview
# → http://localhost:4173
```

### 7.4 GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - install
  - test
  - build

install_dependencies:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 day

run_tests:
  stage: test
  dependencies:
    - install_dependencies
  script:
    - npm test -- --run
    - npm run test:coverage

build_project:
  stage: build
  dependencies:
    - install_dependencies
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
```

---

## 8. Code-Konventionen

### 8.1 Naming Conventions

```typescript
// Components: PascalCase
GraphViewer.tsx
DSLInput.tsx

// Functions: camelCase
parseDSL()
layoutWithDagre()

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 1024 * 1024;

// Types/Interfaces: PascalCase
interface NFA { }
type ParseResult = ...
```

### 8.2 Datei-Organisation

```typescript
// Imports gruppieren
import React from 'react';            // External
import { parseDSL } from '@/core';    // Internal
import type { NFA } from '@/types';   // Types
import './styles.css';                // Styles

// Component
export default function MyComponent() {
  // Hooks
  const [state, setState] = useState();
  
  // Handler
  const handleClick = () => { };
  
  // Render
  return <div>...</div>;
}
```

### 8.3 TypeScript Best Practices

```typescript
// ✅ Gut: Explizite Typen für Funktionen
function parseLine(line: string, num: number): ParsedLine {
  // ...
}

// ✅ Gut: Type Guards
function isNFA(obj: any): obj is NFA {
  return obj && typeof obj.startState === 'string';
}

// ❌ Vermeiden: any ohne Grund
const data: any = fetchData();      // Schlecht

// ✅ Besser: unknown mit Type Guard
const data: unknown = fetchData();
if (isNFA(data)) {
  // data ist jetzt NFA
}
```

### 8.4 React Best Practices

```typescript
// ✅ Gut: Destructuring von Props
function MyComponent({ nfa, onLoad }: Props) { }

// ✅ Gut: Early Returns
if (!nfa) return <div>No NFA</div>;

// ✅ Gut: Memoization für teure Berechnungen
const positions = useMemo(
  () => layoutWithDagre(states, transitions),
  [states, transitions]
);

// ❌ Vermeiden: Inline Functions in Props
<button onClick={() => doSomething()}>  // Neu bei jedem Render

// ✅ Besser: useCallback
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

---

## 9. Debugging

### 9.1 Browser DevTools

```typescript
// Console Logging
console.log('NFA:', nfa);
console.table(transitions);

// React DevTools
// Component-Hierarchie inspizieren
// Props und State überwachen
```

### 9.2 Vitest Debugging

```bash
# Debug einzelner Test
npm test -- --inspect-brk dslParser.test.ts

# UI für Tests
npm run test:ui
```

### 9.3 TypeScript Errors

```bash
# Type-Check ohne Build
npx tsc --noEmit

# Spezifische Datei
npx tsc --noEmit src/core/parser/dslParser.ts
```

---

## 10. Performance-Optimierung

### 10.1 React Performance

```typescript
// Memoization für teure Berechnungen
const nodes = useMemo(
  () => createNodes(nfa, positions),
  [nfa, positions]
);

// Callback-Memoization
const handleNodeClick = useCallback((id: string) => {
  console.log('Clicked:', id);
}, []);

// Component-Memoization
const MemoizedGraph = React.memo(GraphViewer);
```

### 10.2 Graph Performance

```typescript
// Lazy Loading für große Graphen
const visibleNodes = nodes.slice(0, 100);

// Debouncing für Layout-Updates
const debouncedLayout = debounce(layoutWithDagre, 300);
```

---

## 11. Erweiterungen

### 11.1 Neue Komponente hinzufügen

```bash
# Datei erstellen
touch src/components/MyComponent/MyComponent.tsx
touch src/components/MyComponent/MyComponent.test.tsx

# Test erstellen
npm test -- MyComponent.test.tsx
```

### 11.2 Neues Feature entwickeln

1. Branch erstellen: `git checkout -b feature/my-feature`
2. Implementierung in `src/`
3. Tests in `tests/` oder co-located
4. Dokumentation aktualisieren
5. Merge Request erstellen

### 11.3 Parser erweitern

```typescript
// In dslParser.ts
function parseNewFeature(token: string): FeatureInfo {
  // Implementierung
}

// Tests hinzufügen
describe('New Feature', () => {
  it('should parse new syntax', () => {
    // Test
  });
});
```

---

## 12. Troubleshooting

### 12.1 Build-Fehler

```bash
# Cache löschen
rm -rf node_modules dist
npm install

# TypeScript-Fehler
npx tsc --noEmit
```

### 12.2 Test-Fehler

```bash
# Coverage neu generieren
rm -rf coverage
npm run test:coverage

# Mock-Probleme
# → Überprüfen Sie vi.mock() Aufrufe
```

### 12.3 Hot Module Reload (HMR) funktioniert nicht

```bash
# Vite-Config überprüfen
# Server neu starten
npm run dev -- --force
```

---

## 13. API-Referenz

### 13.1 dslParser

```typescript
/**
 * Parsed AEF-Format zu NFA
 * @param input - AEF-String
 * @returns ParseResult mit NFA oder Fehler
 */
export function parseDSL(input: string): ParseResult
```

### 13.2 layoutWithDagre

```typescript
/**
 * Berechnet automatisches Layout für Graph
 * @param states - Liste der Zustände
 * @param transitions - Liste der Transitionen
 * @returns Map von Zustand zu Position
 */
function layoutWithDagre(
  states: string[],
  transitions: Transition[]
): Map<string, { x: number; y: number }>
```

---

## 14. Ressourcen

### 14.1 Externe Dokumentation

- [React 19 Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Guide](https://vitest.dev/)
- [ReactFlow Documentation](https://reactflow.dev/)
- [Dagre Wiki](https://github.com/dagrejs/dagre/wiki)

---

**Version:** 1.0  
**Letzte Aktualisierung:** Januar 2026

#### Key Functions

##### `convertNFAtoDFAWithSteps(nfa: NFA): ConversionResult`
```typescript
export function convertNFAtoDFAWithSteps(nfa: NFA): ConversionResult {
  const steps: SubsetConstructionStep[] = [];
  const dfaStates: string[][] = [];
  const dfaTransitions: Transition[] = [];
  const unmarkedStates: string[][] = [];
  const markedStates: string[][] = [];
  
  // 1. Initialisierung
  const startClosure = epsilonClosure([nfa.startState], nfa);
  dfaStates.push(startClosure);
  unmarkedStates.push(startClosure);
  
  steps.push({
    stepNumber: 1,
    description: "Initialisierung",
    currentState: startClosure,
    // ... 14 weitere Felder
  });
  
  // 2. Hauptschleife (FIFO)
  while (unmarkedStates.length > 0) {
    const currentState = unmarkedStates.shift()!; // FIFO!
    
    for (const symbol of nfa.alphabet) {
      const moveResult = move(currentState, symbol, nfa);
      const epsilonResult = epsilonClosure(moveResult, nfa);
      
      // Neue Transition hinzufügen
      if (epsilonResult.length > 0) {
        dfaTransitions.push({
          from: stateToString(currentState),
          symbol,
          to: stateToString(epsilonResult)
        });
        
        // Neuer Zustand?
        if (!stateExists(epsilonResult, dfaStates)) {
          dfaStates.push(epsilonResult);
          unmarkedStates.push(epsilonResult); // FIFO Queue
        }
      }
      
      // Step aufzeichnen
      steps.push(createStep(...));
    }
    
    markedStates.push(currentState);
  }
  
  return { dfa: createDFA(...), steps };
}
```

#### FIFO vs LIFO
**Wichtig:** Wir verwenden `shift()` statt `pop()` für **FIFO-Verhalten**:

```typescript
// ❌ FALSCH (LIFO - Last In First Out)
const currentState = unmarkedStates.pop();

// ✅ RICHTIG (FIFO - First In First Out)
const currentState = unmarkedStates.shift();
```

**Begründung:** FIFO sorgt für konsistente Reihenfolge wie in Lehrbüchern.

#### Epsilon-Closure
```typescript
function epsilonClosure(states: string[], nfa: NFA): string[] {
  const closure = new Set<string>(states);
  const stack = [...states];
  
  while (stack.length > 0) {
    const state = stack.pop()!;
    
    // Finde alle ε-Übergänge
    const epsilonTransitions = nfa.transitions.filter(
      t => t.from === state && t.symbol === 'ε'
    );
    
    for (const trans of epsilonTransitions) {
      if (!closure.has(trans.to)) {
        closure.add(trans.to);
        stack.push(trans.to);
      }
    }
  }
  
  return Array.from(closure).sort();
}
```

#### Move Function
```typescript
function move(states: string[], symbol: string, nfa: NFA): string[] {
  const result = new Set<string>();
  
  for (const state of states) {
    const transitions = nfa.transitions.filter(
      t => t.from === state && t.symbol === symbol
    );
    
    for (const trans of transitions) {
      result.add(trans.to);
    }
  }
  
  return Array.from(result).sort();
}
```

### 4.2 Step Recording

#### SubsetConstructionStep Interface
```typescript
export interface SubsetConstructionStep {
  stepNumber: number;                  // Schrittnummer (1, 2, 3, ...)
  description: string;                 // "Initialisierung", "Verarbeite..."
  currentState: string[];              // Aktueller Zustand als Array
  currentStateString: string;          // Formatiert: "{q0,q1}"
  isNewState: boolean;                 // Wurde gerade erstellt?
  
  // Optional - nur bei Transitions
  symbol?: string;                     // Verarbeitetes Symbol
  moveResult?: string[];               // Move(S, a)
  epsilonClosureResult?: string[];     // ε-Closure(Move(S, a))
  newDFAState?: string;                // Neuer Zustand (formatiert)
  
  // Zustandsmengen
  dfaStates: string[][];               // Alle bisherigen DFA-Zustände
  dfaTransitions: Transition[];        // Alle Transitionen
  unmarkedStates: string[][];          // Queue der unmarkierten
  markedStates: string[][];            // Bereits verarbeitete
  
  isComplete: boolean;                 // Algorithmus beendet?
}
```

---

## 5. React Components

### 5.1 StepControls Component

**Datei:** `src/components/Controls/StepControls.tsx` (~250 Zeilen)

#### Props Interface
```typescript
interface StepControlsProps {
  steps: SubsetConstructionStep[];
  onStepChange?: (step: SubsetConstructionStep, index: number) => void;
}
```

#### State Management
```typescript
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [speed, setSpeed] = useState<number>(1000); // ms
```

#### Auto-Play Implementation
```typescript
useEffect(() => {
  if (!isPlaying) return;
  
  const timer = setTimeout(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsPlaying(false); // Auto-stop
    }
  }, speed);
  
  return () => clearTimeout(timer);
}, [isPlaying, currentStepIndex, speed, steps.length]);
```

#### Navigation Functions
```typescript
const handleNext = () => {
  if (currentStepIndex < steps.length - 1) {
    setCurrentStepIndex(prev => prev + 1);
  }
};

const handlePrevious = () => {
  if (currentStepIndex > 0) {
    setCurrentStepIndex(prev => prev - 1);
  }
};

const handleFirst = () => setCurrentStepIndex(0);
const handleLast = () => setCurrentStepIndex(steps.length - 1);
```

#### Callback Pattern
```typescript
useEffect(() => {
  if (onStepChange && steps[currentStepIndex]) {
    onStepChange(steps[currentStepIndex], currentStepIndex);
  }
}, [currentStepIndex, steps, onStepChange]);
```

### 5.2 SubsetTable Component

**Datei:** `src/components/SubsetTable/SubsetTable.tsx` (~140 Zeilen)

#### Props Interface
```typescript
interface SubsetTableProps {
  step: SubsetConstructionStep;
  alphabet: string[];
}
```

#### Transition Map (Performance)
```typescript
const transitionMap = new Map<string, string>();

step.dfaTransitions.forEach(t => {
  const key = `${t.from}|${t.symbol}`;
  transitionMap.set(key, t.to);
});

// O(1) Lookup statt O(n) Array-Suche
const target = transitionMap.get(`${stateStr}|${symbol}`);
```

#### State Comparison
```typescript
const isMarked = (state: string[]) => {
  return step.markedStates.some(ms => 
    ms.length === state.length && 
    ms.every((s, i) => s === state[i])
  );
};

const isCurrent = (state: string[]) => {
  return step.currentState.length === state.length &&
         step.currentState.every((s, i) => s === state[i]);
};
```

#### Dynamic Styling
```typescript
<tr className={`
  ${current ? 'bg-blue-100 border-2 border-blue-500' : ''}
  ${!current && !marked ? 'bg-orange-50' : ''}
  hover:bg-blue-50 transition-colors
`}>
```

### 5.3 GraphViewer Component

**Datei:** `src/components/GraphViewer/GraphViewer.tsx`

#### ReactFlow Integration
```typescript
import ReactFlow, { 
  Node, 
  Edge, 
  MarkerType,
  Background,
  Controls 
} from 'reactflow';
import dagre from 'dagre';
```

#### Node Layout mit Dagre
```typescript
function layoutWithDagre(
  nodes: Node[], 
  edges: Edge[]
): { nodes: Node[], edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });
  
  // Nodes hinzufügen
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 80, height: 80 });
  });
  
  // Edges hinzufügen
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Layout berechnen
  dagre.layout(dagreGraph);
  
  // Positionen anwenden
  const layoutedNodes = nodes.map(node => {
    const position = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: position.x - 40, y: position.y - 40 }
    };
  });
  
  return { nodes: layoutedNodes, edges };
}
```

#### Custom Node Styles
```typescript
const nodeStyle = (isStart: boolean, isAccept: boolean) => ({
  border: isAccept ? '4px double #000' : '2px solid #000',
  borderRadius: '50%',
  width: 60,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: isStart ? '#e3f2fd' : '#fff'
});
```

---

## 6. Testing

### 6.1 Test Setup

**Datei:** `src/test-setup.ts`
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

**Konfiguration:** `vitest.config.ts`
```typescript
export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/test-setup.ts',
        'src/main.tsx'
      ],
      all: true,
      clean: true
    }
  }
}));
```

### 6.2 Testing Patterns

#### Test Isolation
```typescript
import { render, within, cleanup } from '@testing-library/react';

describe('ComponentName', () => {
  afterEach(() => {
    cleanup(); // DOM säubern
  });
  
  it('should render correctly', () => {
    const { container } = render(<Component />);
    const component = within(container);
    
    // Queries auf Container beschränken
    const button = component.getByText(/click me/i);
    expect(button).toBeInTheDocument();
  });
});
```

#### Async Testing
```typescript
it('should handle async updates', async () => {
  render(<Component />);
  
  fireEvent.click(screen.getByText(/load/i));
  
  // Warten auf Async-Updates
  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
  });
});
```

#### Multiple Elements
```typescript
it('should handle duplicate elements', () => {
  render(<Component />);
  
  // Wenn Text mehrfach vorkommt
  const elements = screen.getAllByText(/state/i);
  expect(elements.length).toBeGreaterThanOrEqual(1);
  expect(elements[0]).toBeInTheDocument();
});
```

### 6.3 Coverage Goals

**Aktuelle Coverage: 87.75%**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Statements | >95% | 100% | ✅ Exceeds |
| Branches | >80% | 85.2% | ✅ Meets |
| Functions | >75% | 78.05% | ✅ Meets |
| Lines | >95% | 100% | ✅ Exceeds |

#### Coverage Report anzeigen
```bash
npm test -- --coverage --run
open coverage/index.html
```

---

## 7. TypeScript Types

### 7.1 Core Types

**Datei:** `src/core/models/types.ts`

```typescript
// NFA Definition
export interface NFA {
  name: string;
  regex?: string;
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string;
  acceptStates: string[];
}

// DFA Definition
export interface DFA {
  name: string;
  regex?: string;
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string;
  acceptStates: string[];
}

// Transition
export interface Transition {
  from: string;
  to: string;
  symbol: string;
}

// Conversion Result
export interface ConversionResult {
  dfa: DFA;
  steps: SubsetConstructionStep[];
}

// Parse Result
export interface ParseResult {
  success: boolean;
  nfa?: NFA;
  error?: string;
  line?: number;
}

// DSL Parse Error
export class DSLParseError extends Error {
  line?: number;
  
  constructor(message: string, line?: number) {
    super(message);
    this.name = 'DSLParseError';
    this.line = line;
  }
}
```

### 7.2 Component Props Types

```typescript
// StepControls
interface StepControlsProps {
  steps: SubsetConstructionStep[];
  onStepChange?: (step: SubsetConstructionStep, index: number) => void;
}

// SubsetTable
interface SubsetTableProps {
  step: SubsetConstructionStep;
  alphabet: string[];
}

// GraphViewer
interface GraphViewerProps {
  automaton: NFA | DFA;
  title: string;
  highlightedStates?: Set<string>;
}
```

---

## 8. State Management

### 8.1 Home Component State

```typescript
const [nfa, setNfa] = useState<NFA | null>(null);
const [currentStep, setCurrentStep] = useState<SubsetConstructionStep | null>(null);

// Memoized DFA Conversion
const conversionResult = useMemo(() => {
  if (!nfa) return null;
  return convertNFAtoDFAWithSteps(nfa);
}, [nfa]);
```

### 8.2 Callback Patterns

```typescript
// Parent → Child Communication
<StepControls 
  steps={conversionResult?.steps || []}
  onStepChange={(step, index) => {
    setCurrentStep(step);
    console.log(`Step ${index + 1}:`, step);
  }}
/>

// Child notifies Parent
const handleStepChange = useCallback((
  step: SubsetConstructionStep, 
  index: number
) => {
  if (onStepChange) {
    onStepChange(step, index);
  }
}, [onStepChange]);
```

---

## 9. Performance Optimizations

### 9.1 React Optimizations

#### useMemo for expensive calculations
```typescript
const conversionResult = useMemo(() => {
  if (!nfa) return null;
  return convertNFAtoDFAWithSteps(nfa);
}, [nfa]); // Only recalculate when NFA changes
```

#### useCallback for event handlers
```typescript
const handleStepChange = useCallback((step, index) => {
  if (onStepChange) {
    onStepChange(step, index);
  }
}, [onStepChange]);
```

### 9.2 Algorithm Optimizations

#### Transition Map (O(1) lookup)
```typescript
// Statt O(n) Array-Suche:
const transition = dfaTransitions.find(
  t => t.from === state && t.symbol === symbol
); // O(n)

// Besser: Map für O(1):
const transitionMap = new Map<string, string>();
dfaTransitions.forEach(t => {
  transitionMap.set(`${t.from}|${t.symbol}`, t.to);
});
const target = transitionMap.get(`${state}|${symbol}`); // O(1)
```

#### State Set Operations
```typescript
// Set für schnelle Lookups
const closure = new Set<string>(states);

// Array.sort() für konsistente Reihenfolge
return Array.from(closure).sort();
```

---

## 10. Build & Deployment

### 10.1 Production Build
```bash
# Build erstellen
npm run build

# Output in dist/
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── index.html
```

### 10.2 Build Configuration

**vite.config.ts**
```typescript
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'flow-vendor': ['reactflow', 'dagre'],
        }
      }
    }
  }
});
```

### 10.3 Environment Variables
```bash
# .env.local
VITE_APP_NAME=NFA to DFA Visualizer
VITE_APP_VERSION=1.0.0
```

```typescript
// Access in code
const appName = import.meta.env.VITE_APP_NAME;
```

---

## 11. Debugging

### 11.1 Browser DevTools

#### React DevTools
- Installieren: [React DevTools Extension](https://react.dev/learn/react-developer-tools)
- Komponenten-Hierarchie inspizieren
- Props und State live anzeigen

#### Console Logging
```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Step:', step);
  console.table(dfaStates);
}
```

### 11.2 Vitest Debugging

```bash
# Tests mit UI
npm run test:ui

# Einzelner Test
npm test -- SubsetTable.test.tsx

# Mit Breakpoints
npm test -- --inspect-brk
```

### 11.3 Common Issues

#### Issue: "Module not found"
```bash
# Lösung: Cache löschen
rm -rf node_modules
npm install
```

#### Issue: "Type Error in tests"
```typescript
// Lösung: Mock types definieren
vi.mock('reactflow', () => ({
  ReactFlow: vi.fn(),
  Node: vi.fn(),
  Edge: vi.fn(),
}));
```

#### Issue: "Tests fail with 'not wrapped in act(...)'"
```typescript
// Lösung: waitFor verwenden
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument();
});
```

---

## 12. Contribution Guidelines

### 12.1 Branch Naming
```
feature/issue-XX-short-description
bugfix/issue-XX-short-description
hotfix/critical-bug-description
docs/update-readme
```

### 12.2 Commit Messages
```
feat(issue-XX): Add new feature
fix(issue-XX): Fix bug in component
docs(issue-XX): Update documentation
test(issue-XX): Add tests for feature
refactor(issue-XX): Refactor algorithm
style: Format code
chore: Update dependencies
```

### 12.3 Pull Request Template
```markdown
## Issue
Closes #XX

## Changes
- [ ] Feature 1
- [ ] Feature 2

## Testing
- [ ] Unit tests passing (132/132)
- [ ] Coverage > 85%
- [ ] Manual testing done

## Screenshots
[Add if applicable]
```

### 12.4 Code Review Checklist
- [ ] TypeScript strict mode passing
- [ ] No ESLint errors
- [ ] Tests added/updated
- [ ] Coverage maintained
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Accessible (ARIA labels)

---

## 13. API Reference

### 13.1 Core Functions

#### `convertNFAtoDFA(nfa: NFA): DFA`
Konvertiert NFA zu DFA ohne Step-Recording.

```typescript
const dfa = convertNFAtoDFA(nfa);
console.log(dfa.states); // ['q0', '{q0,q1}', ...]
```

#### `convertNFAtoDFAWithSteps(nfa: NFA): ConversionResult`
Konvertiert mit vollständiger Step-Historie.

```typescript
const result = convertNFAtoDFAWithSteps(nfa);
console.log(result.steps.length); // Anzahl Schritte
console.log(result.dfa); // Finaler DFA
```

#### `parseNFA(dslString: string): ParseResult`
Parst DSL zu NFA.

```typescript
const result = parseNFA(dslText);
if (result.success) {
  const nfa = result.nfa!;
} else {
  console.error(result.error, result.line);
}
```

### 13.2 Helper Functions

#### `stateToString(state: string[]): string`
```typescript
stateToString(['q0', 'q1']) // "{q0,q1}"
stateToString([]) // "∅"
stateToString(['q0']) // "q0"
```

#### `stateExists(state: string[], states: string[][]): boolean`
```typescript
const exists = stateExists(['q0', 'q1'], dfaStates);
```

---

## 14. Troubleshooting

### 14.1 Häufige Fehler

#### "Cannot find module '@/components/...'"
**Ursache:** Path alias nicht konfiguriert  
**Lösung:** Überprüfe `tsconfig.json` und `vite.config.ts`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### "Tests timeout after 5000ms"
**Ursache:** Async Operation zu langsam  
**Lösung:** Timeout erhöhen

```typescript
it('should work', async () => {
  // ...
}, 10000); // 10 Sekunden Timeout
```

#### "Coverage report empty"
**Ursache:** Falsche Coverage-Konfiguration  
**Lösung:** Überprüfe `vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['**/*.test.{ts,tsx}']
}
```

---

## 15. Roadmap

### 15.1 Planned Features
- [ ] Export als PNG/SVG
- [ ] JFLAP Format Support
- [ ] Undo/Redo
- [ ] Graph Zoom/Pan
- [ ] Keyboard Shortcuts
- [ ] Dark Mode
- [ ] Internationalization (i18n)

### 15.2 Performance Improvements
- [ ] Virtual Scrolling für große Tabellen
- [ ] Web Workers für Algorithmus
- [ ] Lazy Loading von Graphen

### 15.3 Testing Improvements
- [ ] E2E Tests mit Playwright
- [ ] Visual Regression Tests
- [ ] Performance Benchmarks

---

## 16. Kontakt

**Entwickler:**
- Dateng Tankoua Emery Josian: Datengta@students.uni-marburg.de
- Zhang Ziyan: Zhangzi@students.uni-marburg.de

**Institution:**
- Philipps-Universität Marburg
- Fachbereich Mathematik und Informatik

**Repository:**
- GitLab: [visualizing_lexical_analysis_subsetconstruction]

---

## Appendix: Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests (watch mode)
npm run test:ui          # Run tests with UI
npm test -- --run        # Run tests once
npm test -- --coverage   # Generate coverage

# Linting
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix issues

# Git
git status               # Check status
git log --oneline -10    # Last 10 commits
git diff                 # Show changes

# Package Management
npm outdated             # Check outdated packages
npm update               # Update packages
npm audit                # Security audit
```

---

**Happy Coding!**
