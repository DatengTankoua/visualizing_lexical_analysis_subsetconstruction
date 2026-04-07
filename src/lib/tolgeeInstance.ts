import { Tolgee, DevTools, FormatSimple } from '@tolgee/web'

export const tolgeeInstance = Tolgee()
  .use(DevTools())
  .use(FormatSimple())
  .init({
    language: "en",
    fallbackLanguage: "de",

    apiUrl: import.meta.env.VITE_TOLGEE_API_URL,
    apiKey: import.meta.env.VITE_TOLGEE_API_KEY,

    staticData: {
      de: {
        home: { title: "NFA → DFA Visualizer" },

        input: {
          dsl: {
            title: "DSL-Eingabe(AEF-Format)",
            placeholder:
              "Fügen Sie hier Ihre DSL ein...\n\nAEF-Format Beispiel:\n# @NAME Example1_NFA\n# @REGEX (1.(0.1)+)|(0.0)\n\n.q0 -1> q1 -0> q2 -1> q3 -0> q4;\nq3 -ε> (q5);\n.q0 -0> q6 -0> (q5);\nq4 -1> q3;",
          },
          example: {
            label: "Beispiel laden",
            placeholder: "Wählen Sie ein Beispiel aus",
            nfa_withEps: "Beispiel NFA mit ε-Übergängen",
            nfa_withoutEps: "Beispiel NFA ohne ε",
          },
          file: {
            label: "Datei hochladen",
            choose: "Datei auswählen",
            none: "Keine Datei ausgewählt",
          },
          actions: {
            loadNfa: "🚀 NFA laden",
            loading: "⏳ Lädt...",
          },
          errors: {
            emptyDsl: "Bitte geben Sie eine DSL-Definition ein",
            fileTooLarge:
              "Die Datei ist zu groß ({{size}MB}). Maximale Größe: {max} MB",
            fileRead: "Fehler beim Lesen der Datei",
            exampleLoad: "Fehler beim Laden des Beispiels: {{error}}",
          },
        },
        errors: {
          parsing: {
            title: "Parsing-Fehler",
            line: "Zeile",
          },
        },
        controls: {
          noSteps: "Keine Schritte verfügbar",
          title: "Subset Construction",
          stepCounter: "Schritt",
          stepLabel: "Schritt",
          currentState: "Aktueller Zustand",
          symbol: "Symbol",
          moveResult: "Move-Ergebnis",
          epsilonClosure: "ε-Abschluss",
          newDFAState: "DFA-Zustand",
          new: "Neu",
          stats: {
            dfaStates: "DFA-Zustände",
            transitions: "Übergänge",
            unmarked: "Unmarkiert",
          },
          complete: {
            title: "Konstruktion abgeschlossen!",
            text: "DFA mit",
            statesAnd: "Zuständen und",
            transitionsSuffix: "Übergängen konstruiert.",
          },
          buttons: {
            start: "Anfang",
            back: "Zurück",
            play: "Abspielen",
            pause: "Pause",
            next: "Weiter",
            end: "Ende",
          },
          titles: {
            toStart: "Zum Anfang",
            toEnd: "Zum Ende",
          },
          speed: {
            label: "Geschwindigkeit:",
            slow: "Langsam (2s)",
            normal: "Normal (1s)",
            fast: "Schnell (0.5s)",
          },
        },
        table: {
          title: "Übergangstabelle",
          headers: {
            state: "Zustand",
            status: "Status",
          },
          current: "aktuell",
          empty: "—",
          status: {
            marked: "markiert",
            unmarked: "unmarkiert",
          },
          legend: {
            currentState: "Aktueller Zustand",
            currentTransition: "Aktuelle Transition (⚡)",
            unmarked: "Unmarkiert (○)",
            marked: "Markiert (✓)",
          },
        },
        nfa: {
          summary: { title: "NFA - Zusammenfassung" },
          regex: "RegEx",
        },
        dfa: {
          summary: { title: "DFA - Zusammenfassung" },
          stateComparison: "Zustandsvergleich",
        },
        labels: {
          states: "Zustände",
          alphabet: "Alphabet",
          start: "Start",
          accepting: "Akzeptierend",
          transitions: "Übergänge",
          withEpsilon: "mit ε-Übergängen",
        },
        section: {
          subset: "Subset Construction",
          graph: "Graphvisualisierung",
        },
        graph: {
          nfa: {
            title: "NFA (Original)",
            empty: "NFA Visualisierung hier",
          },
          dfa: {
            step: "DFA (Schritt)",
            empty: "DFA Visualisierung hier",
          },
        },

        // Übersetzungen für Algorithmus-Schritte (subsetConstruction.ts)
        algorithm: {
          init: "Initialisierung: ε-closure({{startState}}) = {{closure}}",
          selectUnmarked: "Wähle unmarked Zustand: {{state}}",
          move: "move({{state}}, {{symbol}}) = {{result}}",
          epsilonClosureEmpty:
            "ε-closure({{states}}) = ∅ → Keine neue Transition",
          epsilonClosure: "ε-closure({{states}}) = {{result}}",
          newState: "Neuer DFA-Zustand gefunden: {{state}}",
          stateExists: "Zustand {{state}} existiert bereits",
          transitionAdded:
            "Transition hinzugefügt: {{from}} -{{symbol}}→ {{to}}",
          complete:
            "Fertig! DFA konstruiert mit {{states}} Zuständen und {{transitions}} Transitionen",
        },
      },

      en: {
        home: { title: "NFA → DFA Visualizer" },
        input: {
          dsl: {
            title: "DSL Input (AEF Format)",
            placeholder:
              "Paste your DSL here...\n\nAEF Format Example:\n# @NAME Example1_NFA\n# @REGEX (1.(0.1)+)|(0.0)\n\n.q0 -1> q1 -0> q2 -1> q3 -0> q4;\nq3 -ε> (q5);\n.q0 -0> q6 -0> (q5);\nq4 -1> q3;",
          },
          example: {
            label: "Load Example",
            placeholder: "Select an example",
            nfa_withEps: "Example NFA with ε",
            nfa_withoutEps: "Example NFA without ε",
          },
          file: {
            label: "Upload File",
            choose: "Choose File",
            none: "No file chosen",
          },
          actions: {
            loadNfa: "🚀 Load NFA",
            loading: "⏳ Loading...",
          },
          errors: {
            emptyDsl: "Please enter a DSL definition",
            fileTooLarge:
              "The file is too large ({{size}} MB). Max size: {max} MB",
            fileRead: "Error reading the file",
            exampleLoad: "Error loading example: {msg}",
          },
        },
        errors: {
          parsing: {
            title: "Parsing Error",
            line: "Line",
          },
        },
        controls: {
          noSteps: "No steps available",
          title: "Subset Construction",
          stepCounter: "Step",
          stepLabel: "Step",
          currentState: "Current State",
          symbol: "Symbol",
          moveResult: "Move Result",
          epsilonClosure: "ε-closure",
          newDFAState: "DFA State",
          new: "New",
          stats: {
            dfaStates: "DFA States",
            transitions: "Transitions",
            unmarked: "Unmarked",
          },
          complete: {
            title: "Construction completed!",
            text: "DFA with",
            statesAnd: "states and",
            transitionsSuffix: "transitions.",
          },
          buttons: {
            start: "Start",
            back: "Back",
            play: "Play",
            pause: "Pause",
            next: "Next",
            end: "End",
          },
          titles: {
            toStart: "Go to start",
            toEnd: "Go to end",
          },
          speed: {
            label: "Speed:",
            slow: "Slow (2s)",
            normal: "Normal (1s)",
            fast: "Fast (0.5s)",
          },
        },
        table: {
          title: "Transition Table",
          headers: {
            state: "State",
            status: "Status",
          },
          current: "current",
          empty: "—",
          status: {
            marked: "marked",
            unmarked: "unmarked",
          },
          legend: {
            currentState: "Current State",
            currentTransition: "Current Transition (⚡)",
            unmarked: "Unmarked (○)",
            marked: "Marked (✓)",
          },
        },
        nfa: {
          summary: { title: "NFA – Summary" },
          regex: "RegEx",
        },
        dfa: {
          summary: { title: "DFA – Summary" },
          stateComparison: "State comparison",
        },
        labels: {
          states: "States",
          alphabet: "Alphabet",
          start: "Start",
          accepting: "Accepting",
          transitions: "Transitions",
          withEpsilon: "with ε-transitions",
        },
        section: {
          subset: "Subset construction",
          graph: "Graph visualization",
        },
        graph: {
          nfa: {
            title: "NFA (Original)",
            empty: "NFA visualization here",
          },
          dfa: {
            step: "DFA (Step)",
            empty: "DFA visualization here",
          },
        },

        // Translations for algorithm steps (subsetConstruction.ts)
        algorithm: {
          init: "Initialization: ε-closure({{startState}}) = {{closure}}",
          selectUnmarked: "Select unmarked state: {{state}}",
          move: "move({{state}}, {{symbol}}) = {{result}}",
          epsilonClosureEmpty: "ε-closure({{states}}) = ∅ → No new transition",
          epsilonClosure: "ε-closure({{states}}) = {{result}}",
          newState: "New DFA state found: {{state}}",
          stateExists: "State {{state}} already exists",
          transitionAdded: "Transition added: {{from}} -{{symbol}}→ {{to}}",
          complete:
            "Done! DFA constructed with {{states}} states and {{transitions}} transitions",
        },
      },
    },
  });
