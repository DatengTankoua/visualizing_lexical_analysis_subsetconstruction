# Projektdokumentation: NFA Visualisierung mit Subset Construction

**Projekt:** Visualizing Lexical Analysis  Subset Construction  
**Version:** 1.1.0  
**Datum:** März 2026  
**Autoren:** Dateng Tankoua Emery Josian, Zhang Ziyan  
**Betreuung:** M.Sc. Teresa Dreyer

---

## 1. Projektziel

Interaktive Webanwendung zur Visualisierung der Umwandlung von NFAs in DFAs mittels Subset Construction Algorithmus  als didaktisches Tool für Studierende der Theoretischen Informatik.

**Kernfunktionen:**
- NFA-Import im AEF-Format (Datei, Texteingabe, Beispiele)
- Graph-Visualisierung von NFA und DFA (nebeneinander)
- Schrittweise Subset Construction mit Auto-Play
- DFA-Export im AEF-Format
- Mehrsprachige UI (Deutsch / Englisch)
- Kontrastreicher Modus (High-Contrast) für Barrierearmut

---

## 2. Technologie-Stack

| Bereich | Technologie |
|---------|------------|
| UI-Framework | React 19.1.1 + TypeScript 5.9.3 |
| Build | Vite 7.1.7 |
| Styling | TailwindCSS 4.1.16 |
| Graph | ReactFlow 11.11.4 + Dagre 0.8.5 |
| i18n | @tolgee/react 6.2.7 (DE/EN) |
| Tests | Vitest 2.1.9 + @testing-library/react 16.3.1 |
| Linting | ESLint 9.36.0 |

---

## 3. Architektur

```
DSL-Eingabe (AEF)
       
       
  dslParser.ts  NFA-Modell
                       
                       
          subsetConstruction.ts
                       
             
                                 
      StepControls           SubsetTable
      (Navigation)         (DFA-Tabelle)
             
             
       GraphViewer
   (NFA + DFA nebeneinander)
             
             
       exportAef.ts  Download (.aef)
```

---

## 4. Komponenten

| Datei | Aufgabe |
|-------|---------|
| `DSLInput.tsx` | AEF-Eingabe, Datei-Upload, Beispiele laden |
| `GraphViewer.tsx` | ReactFlow-Graph: NFA und DFA |
| `StepControls.tsx` | Navigation, Auto-Play, Geschwindigkeit |
| `SubsetTable.tsx` | DFA-Übergangstabelle mit Farbcodierung |
| `LanguageToggle.tsx` | Sprachwechsel DE/EN |
| `HighContrastToggle.tsx` | Kontrastreicher Modus (Barrierearmut) |
| `dslParser.ts` | AEF  NFA-Objekt (12+ Validierungsregeln) |
| `subsetConstruction.ts` | NFA  DFA (FIFO Subset Construction), Schritttexte in Englisch |
| `exportAef.ts` | DFA  AEF-Datei |
| `tolgeeInstance.ts` | Gemeinsame Tolgee-Instanz (DE/EN Übersetzungen) |

---

## 5. Datenmodelle

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

## 6. AEF-Format

```
# @NAME   <Automatname>
# @REGEX  <regulärer Ausdruck>

.q0 -a> q1 -b> (q2);    # Startzustand: .q0, Akzeptierend: (q2)
q0 -ε> q3;               # Epsilon-Transition
```

**Regeln:**
- Jede Transitionszeile endet mit `;`
- Genau ein Startzustand (`.`), mindestens ein Akzeptierend-Zustand `()`
- Markierungen gelten projektübergreifend  einmalig reicht
- Maximal ein Automat pro Datei

---

## 7. Tests

| Test-Datei | Tests | Bereich |
|-----------|-------|---------|
| `dslParser.test.ts` | 34 | Parser-Logik & Validierung |
| `subsetConstruction.test.ts` | 16 | NFADFA Algorithmus |
| `exportAef.test.ts` | 3 | Export-Format |
| `exportAef.roundtrip.test.ts` | 1 | ExportImport Roundtrip |
| `DSLInput.test.tsx` | 24 | UI-Komponente |
| `GraphViewer.test.tsx` | 13 | Graph-Rendering |
| `SubsetTable.test.tsx` | 16 | DFA-Tabelle |
| `example-nfa.test.ts` | 17 | Integration mit echten NFA-Dateien |
| **Gesamt** | **124 / 124** |  100% passing |

---

## 8. Deployment

```bash
npm install            # Abhängigkeiten installieren
npm run dev            # Entwicklungsserver  http://localhost:5173
npm run build          # Production-Build  dist/
npm run preview        # Build lokal testen
npm test               # Tests ausführen
npm run test:coverage  # Coverage-Report
```

---

## 9. Projektstatus

**Abgeschlossen:** AEF-Parser, NFA-/DFA-Visualisierung, Datei-Upload, Subset Construction (FIFO), Step-Navigation, DFA-Export, Mehrsprachigkeit (DE/EN), High-Contrast-Modus (Barrierearmut), 124 Tests (100% passing)

---

## 10. Referenzen

- [ReactFlow Docs](https://reactflow.dev/), [Dagre](https://github.com/dagrejs/dagre), [Tolgee](https://tolgee.io/)

---

**Kontakt:** Datengta@students.uni-marburg.de  Zhangzi@students.uni-marburg.de  
**Betreuung:** dreyert@staff.uni-marburg.de
