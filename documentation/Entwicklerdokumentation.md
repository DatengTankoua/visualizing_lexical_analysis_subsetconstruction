# Entwicklerdokumentation: NFA/DFA Visualizer

**Version:** 1.1.0 | **Zielgruppe:** Entwickler, Maintainer

---

## 1. Setup

```bash
npm install        # Abhängigkeiten installieren
npm run dev        # Dev-Server  http://localhost:5173
npm run build      # Production-Build  dist/
npm run preview    # Build testen  http://localhost:4173
npm test           # Tests ausführen
npm run test:coverage  # Coverage-Report
```

---

## 2. Projektstruktur

```
src/
 components/
    Controls/
       StepControls.tsx         # Navigation & Auto-Play
       LanguageToggle.tsx       # DE/EN Sprachwechsel
       HighContrastToggle.tsx   # Kontrastreicher Modus (Barrierearmut)
    FileInput/
       DSLInput.tsx             # AEF-Eingabe & Datei-Upload
       DSLInput.test.tsx
    GraphViewer/
       GraphViewer.tsx          # ReactFlow-Graphen
       GraphViewer.test.tsx
    SubsetTable/
        SubsetTable.tsx          # DFA-Übergangstabelle
        SubsetTable.test.tsx
 core/
    algorithm/
       subsetConstruction.ts    # NFADFA Algorithmus (Schritttexte in English)
       subsetConstruction.test.ts
    export/
       exportAef.ts             # DFAAEF Export
       exportAef.test.ts
       exportAef.roundtrip.test.ts
    models/
       types.ts                 # TypeScript Interfaces
    parser/
        dslParser.ts             # AEFNFA Parser
        dslParser.test.ts
 lib/
    tolgeeInstance.ts            # Gemeinsame Tolgee-Instanz (DE/EN + Algorithm-Keys)
    utils.ts
 pages/
    Home.tsx                     # Hauptseite / Integration
 main.tsx                         # Einstiegspunkt
tests/
 example-nfa.test.ts              # Integrationstests
```

---

## 3. Kern-Module

### dslParser.ts

```typescript
function parseDSL(input: string): ParseResult
```

Liest AEF-Text, validiert Syntax und gibt ein `NFA`-Objekt zurück oder eine Fehlermeldung.

**Validierungsregeln:** Zeilen enden mit `;`  genau ein Startzustand (`.`)  min. ein Akzeptierend-Zustand `()`  korrekte Pfeilsyntax `-symbol>`  keine Leerzeichen in Zustandsnamen  valides Epsilon-Symbol `ε`

### subsetConstruction.ts

```typescript
function convertNFAtoDFAWithSteps(nfa: NFA): ConversionResult
```

Führt FIFO-basierte Subset Construction aus. Gibt DFA-Objekt + Schritthistorie für die Step-Navigation zurück.

### exportAef.ts

```typescript
function exportDfaToAef(dfa: DFA): string
```

Serialisiert DFA als AEF-Text.
Normalisiert Zustandsnamen: `{q0,q1}`  `q0_q1`.

**Nutzung in Home.tsx:**
```typescript
const content = exportDfaToAef(dfa);
const blob = new Blob([content], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = `${dfa.name}.aef`; a.click();
URL.revokeObjectURL(url);
```

### DSLInput.tsx

```typescript
interface Props {
  onLoad: (text: string) => void;
  onParseResult: (result: ParseResult) => void;
}
```

### GraphViewer.tsx

```typescript
interface GraphViewerProps {
  nfa?: NFA;
  dfa?: DFA;
  interactive?: boolean;
}
```

### simulateDfaRun.ts

```typescript
function simulateDfaRun(dfa: DFA, word: string): SimulationResult
```

### WordSimulationPanel.tsx

```typescript
interface Props {
  dfa: DFA | null;
  onActiveStateChange?: (stateId: string | null) => void;
}
```
---


## 4. TypeScript-Typen (`src/core/models/types.ts`)

```typescript
interface NFA {
  name?: string;
  regex?: string;
  states: string[];
  startState: string;
  acceptStates: string[];
  alphabet: string[];
  transitions: Transition[];
  hasEpsilon?: boolean;
}

interface DFA {
  name?: string;
  regex?: string;
  states: string[];       // Potenzmengen-Zustände
  startState: string;
  acceptStates: string[];
  alphabet: string[];
  transitions: Transition[];
}

interface Transition {
  from: string;
  symbol: string;         // Eingabesymbol oder "ε"
  to: string;
}

type ParseResult =
  | { success: true; nfa: NFA }
  | { success: false; error: string; line?: number };
```

---

## 5. Testing

### Testübersicht

| Datei | Tests | Bereich |
|-------|-------|---------|
| `dslParser.test.ts` | 34 | Parser-Logik & Validierung |
| `subsetConstruction.test.ts` | 16 | NFADFA Algorithmus |
| `exportAef.test.ts` | 3 | Export-Format |
| `exportAef.roundtrip.test.ts` | 1 | ExportImport Roundtrip |
| `DSLInput.test.tsx` | 24 | UI-Komponente |
| `GraphViewer.test.tsx` | 13 | Graph-Rendering |
| `SubsetTable.test.tsx` | 16 | DFA-Tabelle |
| `WordSimulationPanel.test.tsx` | 7 | UI-Simulation |
| `simulateDfaRun.test.ts` | 4 | Simulationslogik |
| `example-nfa.test.ts` | 17 | Integration |
| **Gesamt** | **124 / 124** |  100% passing |

### Tolgee-Mock (Pflicht für Komponententen-Tests)

Alle Komponenten die `useTranslate()` aufrufen, benötigen diesen Mock  sonst:
> `Couldn't find tolgee instance, did you forgot to use TolgeeProvider?`

```typescript
vi.mock('@tolgee/react', () => ({
  useTranslate: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        // SubsetTable-Keys:
        'table.title': 'Übergangstabelle',
        'table.headers.state': 'Zustand',
        'table.headers.status': 'Status',
        'table.current': 'aktuell',
        'table.status.marked': 'markiert',
        'table.status.unmarked': 'unmarkiert',
        'table.empty': '',
        'table.legend.currentState': 'Aktueller Zustand',
        'table.legend.currentTransition': 'Aktuelle Transition',
        'table.legend.unmarked': 'Unmarkiert',
        'table.legend.marked': 'Markiert',
        // DSLInput-Keys:
        'input.example.placeholder': 'Wählen Sie ein Beispiel...',
        'input.example.nfa_withEps': 'Example NFA - mit ε',
        'input.example.nfa_withoutEps': 'Example NFA - ohne ε',
        'input.dsl.title': 'DSL-Eingabe (AEF-Format)',
        'input.dsl.placeholder': 'Fügen Sie hier Ihre DSL ein...',
        'input.example.label': 'Beispiel laden',
        'input.file.label': 'Datei hochladen',
        'input.actions.loadNfa': 'NFA laden',
        'input.errors.fileTooLarge': 'Datei ist zu groß: {size}. Max: {maxSize}.',
      };
      const template = translations[key] ?? key;
      if (!params) return template;
      return Object.entries(params).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, v), template
      );
    },
  }),
}));
```

### ReactFlow mocken

```typescript
vi.mock('reactflow', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="reactflow">{props.children}</div>,
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  useNodesState: () => [[], vi.fn()],
  useEdgesState: () => [[], vi.fn()],
  Handle: () => <div />,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));
```

---

## 6. Architektur-Datenfluss

```
DSL-Eingabe (DSLInput.tsx)
         
          parseDSL()
     NFA-Objekt
         
          convertNFAtoDFAWithSteps()
     DFA + Schritthistorie
         
    
                         
GraphViewer.tsx     SubsetTable.tsx
(NFA | DFA Graph)   (DFA-Tabelle)
    
     StepControls.tsx
Navigation (vor/zurück/Auto-Play)

WordSimulationPanel.tsx 
(UI + Wortsimulation) 
   simulateDfaRun()  
   SimulationResult

    
     exportDfaToAef()
DFA-Export als .aef
```

---

## 7. Wichtige Hinweise

- **Zustandsmarkierungen** gelten transitionsweit: `.q0` einmal geschrieben  `q0` bleibt Startzustand in allen Zeilen
- **Epsilon-Symbol** muss Unicode `ε` (U+03B5) sein  nicht das Wort "epsilon"
- **Datei-Limit:** ein Automat pro Datei
- **i18n:** Alle UI-Texte via `useTranslate()` aus `@tolgee/react`. Die gemeinsame Tolgee-Instanz wird in `src/lib/tolgeeInstance.ts` definiert und in `main.tsx` verwendet.
- **High-Contrast:** `HighContrastToggle.tsx` toggelt die CSS-Klasse `high-contrast` auf `document.documentElement`. Alle Styles sind in `src/index.css` unter `html.high-contrast { ... }` definiert. Kein State-Management nötig – reines CSS-Override.

---

## 8. Erweiterungsoptionen

### 8.1 Weitere Export-/Import-Formate (z. B. PDF, SVG, JSON)

Aktuell unterstützt die Anwendung ausschließlich das AEF-Textformat für den Export (`exportDfaToAef`) und Import (`parseDSL`). Das Design ist bewusst modular gehalten, sodass weitere Formate ohne Änderungen an bestehenden Modulen ergänzt werden können.

**Ansatzpunkt:** `src/core/export/`

Für ein neues Format (Beispiel: PDF-Export des DFA-Graphen) genügt eine neue Funktion mit identischer Signatur:

```typescript
// src/core/export/exportDfaToPdf.ts
import type { DFA } from "../models/types";

export async function exportDfaToPdf(dfa: DFA): Promise<void> {
  // z. B. html2canvas + jsPDF oder @react-pdf/renderer
}
```

In `Home.tsx` wird der Button dann einfach um einen weiteren Handler erweitert:

```typescript
const handleExportPdf = async () => {
  if (!dfa) return;
  await exportDfaToPdf(dfa);
};
```

Analog lässt sich ein JSON-Import als zusätzliche Funktion in `src/core/parser/` ablegen, die ebenfalls `ParseResult` zurückgibt und damit direkt mit dem vorhandenen Zustandsmanagement in `Home.tsx` kompatibel ist.

---

### 8.2 Weitere Übersetzungssprachen

Die Internationaliserung basiert auf **Tolgee** (`src/lib/tolgeeInstance.ts`). Aktuell sind Deutsch (`de`) und Englisch (`en`) als statische Schlüssel-Wert-Objekte im `staticData`-Block hinterlegt.

**Ansatzpunkt:** `src/lib/tolgeeInstance.ts`

Eine neue Sprache (Beispiel: Französisch `fr`) wird in drei Schritten ergänzt:

1. Den neuen Sprachblock in `staticData` eintragen – alle bereits vorhandenen Schlüssel übersetzen:

```typescript
staticData: {
  de: { /* ... */ },
  en: { /* ... */ },
  fr: {
    home: { title: "Visualiseur NFA → DFA" },
    controls: {
      title: "Construction par sous-ensembles",
      // ... alle weiteren Keys
    },
    // ...
  },
}
```

2. Den `LanguageToggle` (`src/components/Controls/LanguageToggle.tsx`) um die neue Sprache erweitern, sodass sie auswählbar wird.

3. Optional: `fallbackLanguage` auf `"en"` belassen – bei fehlenden Schlüsseln in `fr` wird automatisch auf Englisch zurückgefallen.

Über die Tolgee-Cloud-API können Übersetzungen alternativ auch zur Laufzeit geladen werden, ohne einen neuen Build erstellen zu müssen (`apiUrl` / `apiKey` in `.env`).

---

**Kontakt:** Datengta@students.uni-marburg.de  Zhangzi@students.uni-marburg.de
