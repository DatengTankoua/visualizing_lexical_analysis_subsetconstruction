# Projektdokumentation: NFA Visualisierung mit Subset Construction

**Projekt:** Visualizing Lexical Analysis - Subset Construction  
**Version:** 1.0.0  
**Datum:** Januar 2026  
**Autoren:** Dateng Tankoua Emery Josian, Zhang Ziyan  
**Betreuung:** M.Sc. Teresa Dreyer

---

## 1. Projektziele

### 1.1 Hauptziel
Entwicklung einer interaktiven Webanwendung zur Visualisierung der Umwandlung von Nichtdeterministischen Endlichen Automaten (NFA) in Deterministische Endliche Automaten (DFA) mittels Subset Construction Algorithmus.

### 1.2 Lernziele
- Didaktisches Tool für Studierende der Theoretischen Informatik
- Visualisierung komplexer Algorithmen der lexikalischen Analyse
- Interaktive Exploration von Automatentheorie-Konzepten

### 1.3 Funktionale Anforderungen
1. Import von NFA-Definitionen im AEF-Format (ein Automat pro Datei, maximal 1 MB)
2. Flexible Zustandserkennung (einmalige Markierung mit `.` oder `()` reicht)
3. Visuelle Darstellung von NFAs als gerichtete Graphen
4. Schrittweise Ausführung des Subset Construction Algorithmus
5. Export der Ergebnisse (DFA-Definition)
6. Unterstützung von Epsilon-Transitionen (ε-Übergänge)

---

## 2. Systemarchitektur

### 2.1 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  DSLInput   │  │ GraphViewer  │  │StepControls  │       │
│  │  (Upload)   │  │(Visualizer)  │  │  (Stepper)   │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────────┐       ┌────────────────────┐         │
│  │  dslParser.ts    │──────→│subsetConstruction  │         │
│  │  (AEF Parser)    │       │   (Algorithmus)    │         │
│  └──────────────────┘       └────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │    NFA     │    │    DFA     │    │ Transition │        │
│  │  (Model)   │    │  (Model)   │    │  (Model)   │        │
│  └────────────┘    └────────────┘    └────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technologie-Stack

**Frontend:**
- React 19.1.1 - UI-Framework
- TypeScript 5.9.3 - Typsicherheit
- Vite 7.1.7 - Build-Tool & Dev-Server
- TailwindCSS 4.1.16 - Styling
- ReactFlow 11.11.4 - Graph-Visualisierung
- Dagre 0.8.5 - Automatisches Graph-Layout

**Testing:**
- Vitest 2.1.9 - Test-Framework
- @testing-library/react - Component Testing
- @testing-library/jest-dom - DOM-Assertions

**DevOps:**
- ESLint - Code-Qualität
- GitLab CI/CD - Continuous Integration
- Node 18+ - Runtime-Umgebung

---

## 3. Komponenten-Übersicht

### 3.1 Kernkomponenten

**DSLInput.tsx**

**Zweck:** Import und Validierung von NFA-Definitionen

**Features:**
- Datei-Upload (.aef, .dsl, .txt) bis 1 MB
- Beispiel-Vorlagen laden
- Live-Textbearbeitung
- Format-Validierung
- Fehlerberichterstattung mit Zeilennummern

**Test-Coverage:** 86.79% Lines, 66.66% Branches

---

**GraphViewer.tsx**

**Zweck:** Visuelle Darstellung von NFAs/DFAs

**Features:**
- Automatisches Layout mit Dagre
- Zustandsknoten mit visuellen Markierungen (Start/Accept)
- Kantenbeschriftung mit Symbolen
- Epsilon-Transitionen (gestrichelt)
- Self-Loops und Rückkanten
- Interaktive Zoom/Pan-Funktionen

**Test-Coverage:** ~75% Lines

---

**dslParser.ts**

**Zweck:** Parsing von AEF-Format zu NFA-Objekten

**Features:**
- 12+ Validierungsregeln
- Metadaten-Extraktion (@NAME, @REGEX)
- Epsilon-Erkennung
- Duplikat-Deduplication
- Detaillierte Fehlerberichte

**Test-Coverage:** 99.09% Lines, 97.72% Branches

---

**subsetConstruction.ts**

**Zweck:** Implementierung des Subset Construction Algorithmus

**Status:** ✅ Abgeschlossen (Sprint 3)

---

## 4. Datenmodelle

### 4.1 NFA (Nichtdeterministischer Endlicher Automat)

```typescript
interface NFA {
  name?: string;              // Optionaler Name
  regex?: string;             // Optionaler regulärer Ausdruck
  states: string[];           // Zustandsmenge
  startState: string;         // Startzustand
  acceptStates: string[];     // Akzeptierende Zustände
  alphabet: string[];         // Eingabealphabet
  transitions: Transition[];  // Übergangsfunktion
  hasEpsilon: boolean;        // ε-Transitionen vorhanden?
}
```

### 4.2 Transition

```typescript
interface Transition {
  from: string;    // Quellzustand
  to: string;      // Zielzustand
  symbol: string;  // Eingabesymbol (oder ε)
}
```

### 4.3 DFA (Deterministischer Endlicher Automat)

```typescript
interface DFA {
  name?: string;
  regex?: string;
  states: string[];           // Potenzmengen als Zustände
  startState: string;
  acceptStates: string[];
  alphabet: string[];
  transitions: Transition[];
}
```

---

## 5. AEF-Format Spezifikation

### 5.1 Syntax

```
# Metadaten (optional)
@NAME <Name des Automaten>
@REGEX <Regulärer Ausdruck>

# Transitionen
<Quellzustand> -<Symbol>> <Zielzustand> [-<Symbol>]...;
```

### 5.2 Zustandsnotationen

| Notation | Bedeutung | Beispiel |
|----------|-----------|----------|
| `.q0` | Startzustand (einmalige Markierung reicht) | `.q0 -a> q1; q0 -b> q2;` |
| `(q1)` | Akzeptierender Zustand (einmalige Markierung reicht) | `q0 -a> (q1); q1 -b> q2;` |
| `(.q0)` | Start- und Akzeptierender Zustand | `(.q0) -a> q1;` |
| `q0` | Normaler Zustand | `q0 -a> q1;` |

**Regel:** Ein Automat pro Datei. Zustandsmarkierungen (`.` und `()`) müssen nur einmal vorkommen.

### 5.3 Beispiel

```
# @NAME Example1_NFA
# @REGEX (1.(0.1)+)|(0.0)

.q0 -1> q1 -0> q2 -1> q3 -0> q4;
q3 -ε> (q5);
.q0 -0> q6 -0> (q5);
q4 -1> q3;
```

---

## 6. Qualitätssicherung

### 6.1 Test-Strategie

**Unit Tests:**
- dslParser.test.ts: 102 Tests für Parser-Logik
- subsetConstruction.test.ts: 16 Tests für Algorithmus
- Fokus: Validierung, Fehlerbehandlung, Edge Cases

**Component Tests:**
- DSLInput.test.tsx: 45 Tests für UI-Komponente
- GraphViewer.test.tsx: 31 Tests für Visualisierung
- StepControls.test.tsx: 14 Tests für Navigation
- SubsetTable.test.tsx: 16 Tests für DFA-Tabelle
- Fokus: Benutzerinteraktionen, Rendering, State Management

**Integration Tests:**
- Fokus: End-to-End Parsing und Validierung

### 6.2 Coverage-Ziele

| Modul | Lines | Branches | Status |
|-------|-------|----------|--------|
| dslParser.ts | 99.09% | 97.72% | ✅ Exzellent |
| DSLInput.tsx | 86.79% | 66.66% | ✅ Gut |
| GraphViewer.tsx | ~75% | ~70% | ✅ Akzeptabel |
| **Gesamt** | **87.75%** | **85.2%** | ✅ **Exzellent** |

### 6.3 CI/CD Pipeline

```yaml
stages:
  - install    # Dependencies installieren
  - test       # Unit & Component Tests
  - build      # Production Build
  - deploy     # Deployment (optional)
```

---

## 7. Deployment

### 7.1 Entwicklungsumgebung

```bash
# Installation
npm install

# Development Server
npm run dev
# → http://localhost:5173

# Tests ausführen
npm test

# Coverage Report
npm run test:coverage
```

### 7.2 Production Build

```bash
# Build erstellen
npm run build
# → Ausgabe in dist/

# Build testen
npm run preview
```

### 7.3 Deployment-Optionen

- **Statisches Hosting:** GitHub Pages, Netlify, Vercel
- **Docker Container:** Nginx + Static Files
- **Uni-Server:** Direktes Deployment auf Webserver

---

## 8. Projektstatus

### 8.1 Abgeschlossen ✅

- ✅ AEF-Format Parser mit strikter Validierung
- ✅ NFA-Visualisierung mit automatischem Layout
- ✅ Datei-Upload und Beispiel-Verwaltung
- ✅ Subset Construction Algorithmus (FIFO)
- ✅ Step-by-Step Navigation mit Auto-Play
- ✅ DFA Tabellen-Visualisierung
- ✅ Comprehensive Test-Coverage (132 Tests, 100% passing)
- ✅ Fehlerberichterstattung mit Zeilennummern

### 8.2 Geplant (Future Work)

- ⏳ Minimierung von DFAs
- ⏳ Reguläre Ausdrücke → NFA Konvertierung
- ⏳ Export als PNG/SVG
- ⏳ JFLAP Format Support

---

## 9. Risiken und Herausforderungen

### 9.1 Technische Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Performance bei großen NFAs | Mittel | Hoch | Lazy Loading, Virtualisierung |
| Browser-Kompatibilität | Niedrig | Mittel | Moderne Browser voraussetzen |
| Layout-Probleme bei komplexen Graphen | Hoch | Mittel | Dagre-Parameter tunen |

### 9.2 Projektrisiken

- **Zeitplan:** Subset Construction komplexer als geplant
- **Testing:** Edge Cases schwer zu identifizieren
- **Usability:** Komplexe UI für Anfänger

---

## 10. Lessons Learned

### 10.1 Erfolge

✅ Strikte Validierung verhindert Fehler frühzeitig  
✅ Test-First Ansatz erhöht Code-Qualität  
✅ ReactFlow + Dagre: Leistungsstarke Graph-Visualisierung  
✅ 132/132 Tests passing (100%)  
✅ 87.75% Code Coverage

### 10.2 Verbesserungspotential

- Frühere User-Tests für besseres UX-Feedback
- Mehr Beispiel-Dateien für verschiedene Edge Cases
- Performance-Profiling bei großen Automaten

---

## 11. Referenzen

- Hopcroft, Motwani, Ullman: Automatentheorie
- [ReactFlow Documentation](https://reactflow.dev/)
- [Dagre Graph Layout](https://github.com/dagrejs/dagre)
- [Vite Documentation](https://vitejs.dev/)

---

**Dokumentversion:** 1.0  
**Letzte Aktualisierung:** Januar 2026

- **Statistiken Display:**
  - Anzahl DFA-Zustände
  - Anzahl Transitionen
  - Anzahl unmarkierter Zustände

- **Step Details:**
  - Aktueller Zustand
  - Verarbeitetes Symbol
  - Move-Resultat
  - Epsilon-Closure-Resultat
  - Neuer DFA-Zustand (mit "NEU" Badge)

### 3.3 DFA Transition Table
**Datei:** `src/components/SubsetTable/SubsetTable.tsx` (~140 Zeilen)

#### Tabellen-Features
- **Dynamische Struktur:** States (Zeilen) × Alphabet (Spalten)
- **Farbcodierung:**
  - 🔵 Blau: Aktueller Zustand
  - 🟡 Gelb + ⚡: Aktuelle Transition
  - 🟠 Orange: Unmarkierter Zustand
  - ⚪ Weiß: Markierter Zustand

- **Status Badges:**
  - ✓ markiert (grün)
  - ○ unmarkiert (orange)

- **Transition Mapping:**
  - O(1) Lookup mit Map-Struktur
  - Effiziente Darstellung großer Zustandsmengen

- **Visuelle Legende:**
  - Erklärung aller Farben
  - Intuitive Symbolik

### 3.4 Graph Visualisierung
**Datei:** `src/components/GraphViewer/GraphViewer.tsx`

#### Layout & Rendering
- **Side-by-Side Display:** NFA links, DFA rechts
- **Dagre Layout:** Automatisches hierarchisches Layout
- **Custom Node Styles:** 
  - Start-Zustände mit Pfeil
  - Akzept-Zustände mit Doppelring
  - Farbcodierung nach Zustandstyp

- **Transition Display:**
  - Bezier-Kurven für bessere Lesbarkeit
  - Edge Labels mit Symbolen
  - Offset bei mehrfachen Kanten

---

## 4. Test-Strategie

### 4.1 Test-Coverage
**Gesamt: 87.75% Average**
- ✅ Statements: 100% (28197/28197)
- ✅ Branches: 85.2% (259/304)
- ✅ Functions: 78.05% (32/41)
- ✅ Lines: 100%

### 4.2 Test-Dateien

#### StepControls.test.tsx (14 Tests)
```typescript
✅ Rendering mit/ohne Steps
✅ Navigation (next, previous, first, last)
✅ Auto-play und Pause
✅ Geschwindigkeitsauswahl
✅ Slider-Navigation
✅ onStepChange Callback
✅ Button Disable-States
✅ Statistiken Display
✅ Step Details Display
✅ Progress Bar Updates
```

#### SubsetTable.test.tsx (16 Tests)
```typescript
✅ Tabellen-Rendering mit Alphabet
✅ Einzelne/Composite/Leere Zustände
✅ Markiert/Unmarkiert Status Badges
✅ Aktueller Zustand Highlighting
✅ Transition Display
✅ Lightning Bolt (⚡) für aktuelle Transition
✅ Legende Rendering
✅ Farbcodierung Verifizierung
```

#### subsetConstruction.test.ts (16 Tests)
```typescript
✅ Einfache NFA zu DFA Konvertierung
✅ Epsilon-Transitions Handling
✅ Multiple Transitions pro Symbol
✅ Accept States Korrektheit
✅ Step Recording (init, move, epsilon-closure, completion)
✅ Marked/Unmarked State Tracking
✅ Name/Regex Preservation
```

### 4.3 Test-Isolation Pattern
```typescript
import { cleanup, within } from '@testing-library/react';

afterEach(() => {
  cleanup(); // DOM zwischen Tests säubern
});

const { container } = render(<Component />);
const component = within(container); // Queries auf Container beschränken
```

---

## 5. Architektur

### 5.1 Projekt-Struktur
```
src/
├── components/
│   ├── Controls/
│   │   ├── StepControls.tsx          (Navigation & Auto-Play)
│   │   └── StepControls.test.tsx     (14 Tests)
│   ├── SubsetTable/
│   │   ├── SubsetTable.tsx           (DFA Tabelle)
│   │   └── SubsetTable.test.tsx      (16 Tests)
│   ├── FileInput/
│   │   ├── DSLInput.tsx              (File Upload & Examples)
│   │   └── DSLInput.test.tsx         (45 Tests)
│   └── GraphViewer/
│       ├── GraphViewer.tsx           (ReactFlow Integration)
│       └── GraphViewer.test.tsx      (31 Tests)
├── core/
│   ├── algorithm/
│   │   ├── subsetConstruction.ts     (Algorithmus + FIFO)
│   │   └── subsetConstruction.test.ts (16 Tests)
│   ├── models/
│   │   └── types.ts                  (TypeScript Interfaces)
│   └── parser/
│       ├── dslParser.ts              (DSL Parsing)
│       └── dslParser.test.ts         (102 Tests)
├── pages/
│   └── Home.tsx                      (Main Integration Page)
└── utils/
    └── helpers.ts                    (Utility Functions)
```

### 5.2 Datenfluss
```
DSL Input → Parser → NFA Model
                        ↓
            convertNFAtoDFAWithSteps()
                        ↓
        SubsetConstructionStep[] (History)
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
    StepControls            SubsetTable
    (Navigation)            (Visualisierung)
            ↓                       ↓
        GraphViewer (NFA + DFA Side-by-Side)
```

---

## 6. Entwicklungs-Workflow

### 6.1 Issue-Tracking
Alle Implementierungen sind mit Issues verknüpft:
- #23: Subset Construction Grundlogik ✅
- #24: Accept Propagation ✅
- #25: Transition Mapping ✅
- #26: Step-by-Step Modus ✅
- #27: Historie speichern ✅
- #28: Step Visualisierung ✅
- #29: DFA Graph Rendering ✅
- #30: DFA Tabelle ✅

### 6.2 Git Workflow
```bash
# Branch pro Issue
git checkout -b feature/issue-XX-beschreibung

# Commit Convention
feat(issue-XX): Kurzbeschreibung

Detaillierte Beschreibung
- Bullet point 1
- Bullet point 2

Closes #XX

# Push und PR
git push origin feature/issue-XX-beschreibung
```

### 6.3 Code Quality Gates
- ✅ TypeScript strict mode
- ✅ ESLint passing
- ✅ All tests passing (132/132)
- ✅ Coverage > 85%
- ✅ No console errors

---

## 7. Performance-Optimierungen

### 7.1 React Performance
```typescript
// Memoization für DFA Konvertierung
const conversionResult = useMemo(() => {
  if (!nfa) return null;
  return convertNFAtoDFAWithSteps(nfa);
}, [nfa]);
```

### 7.2 Transition Lookup
```typescript
// O(1) Map statt O(n) Array-Suche
const transitionMap = new Map<string, string>();
step.dfaTransitions.forEach(t => {
  const key = `${t.from}|${t.symbol}`;
  transitionMap.set(key, t.to);
});
```

---

## 8. Bekannte Limitierungen

### 8.1 Browser Support
- Moderne Browser erforderlich (Chrome 90+, Firefox 88+, Safari 14+)
- LocalStorage für Beispiele
- CSS Grid und Flexbox

### 8.2 Performance
- Große NFAs (>50 Zustände) können langsam sein
- Auto-Play bei schneller Geschwindigkeit kann bei komplexen Graphen ruckeln

### 8.3 Feature Roadmap
- [ ] Export als PNG/SVG
- [ ] Import von anderen Formaten (JFLAP, etc.)
- [ ] Zoom und Pan für große Graphen
- [ ] Undo/Redo Funktionalität

---

## 9. Deployment

### 9.1 Build
```bash
npm run build
# Erstellt dist/ Ordner mit optimierten Dateien
```

### 9.2 Lokale Installation
```bash
# Installation
npm install

# Development Server
npm run dev

# Tests
npm test

# Coverage Report
npm test -- --coverage --run
```

---

## 10. Lessons Learned

### 10.1 Testing Best Practices
- ✅ Test-Isolation mit `cleanup()` ist essentiell
- ✅ `within(container)` verhindert Cross-Contamination
- ✅ `waitFor()` für alle async State-Updates
- ✅ `getAllByText()` für mehrfach vorkommende Elemente

### 10.2 React Patterns
- ✅ useMemo für teure Berechnungen
- ✅ useCallback für Event-Handler in Child Components
- ✅ Separation of Concerns (Presentation vs. Logic)

### 10.3 TypeScript Benefits
- ✅ Type Safety verhindert Runtime-Errors
- ✅ Interface-Dokumentation als Code
- ✅ Refactoring Confidence

---

## 11. Kontakt & Support

**Projektteam:**
- Dateng Tankoua Emery Josian: Datengta@students.uni-marburg.de
- Zhang Ziyan: Zhangzi@students.uni-marburg.de

**Betreuung:**
- M.Sc. Teresa Dreyer: dreyert@staff.uni-marburg.de

**Repository:**
- GitLab: [visualizing_lexical_analysis_subsetconstruction](https://git.informatik.uni-marburg.de/)
