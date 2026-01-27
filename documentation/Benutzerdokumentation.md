# Benutzerdokumentation: NFA Visualisierung

**Anwendung:** NFA/DFA Visualizer  
**Version:** 1.0.0  
**Zielgruppe:** Studierende, Dozenten, Entwickler

---

## 1. Erste Schritte

### 1.1 Zugriff auf die Anwendung

**Entwicklungsumgebung:**
```bash
npm install
npm run dev
```
Öffnen Sie http://localhost:5173 im Browser.

**Produktionsumgebung:** Die Anwendung ist als statische Website verfügbar.

### 1.2 Browser-Anforderungen

**Unterstützte Browser:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Nicht unterstützt:**
- ❌ Internet Explorer

---

## 2. Benutzeroberfläche

### 2.1 Hauptbereiche

```
┌────────────────────────────────────────────────┐
│ DSL-Eingabe (AEF-Format)                       │
│ ┌──────────────────────────────────────────┐   │
│ │ # @NAME MyNFA                            │   │
│ │ .q0 -a> q1 -b> (q2);                     │   │
│ └──────────────────────────────────────────┘   │
│ [ Beispiel] [ Upload] [ NFA laden]             │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│ Graph-Visualisierung                           │
│                                                │
│ (●)──a──→(●)──b──→((●))                        │
│ q0       q1       q2                           │
│                                                │
│ [Zoom] [Pan] [Fit View] [MiniMap]              │
└────────────────────────────────────────────────┘
```

### 2.2 DSL-Eingabebereich

**Funktionen:**
1. **Textbereich**: Manuelle Eingabe von NFA-Definitionen
2. **Beispiel-Dropdown**: Vorgefertigte Beispiele laden
3. **Datei-Upload**: `.aef`, `.dsl`, oder `.txt` Dateien hochladen
4. **Laden-Button**: NFA parsen und visualisieren

---

## 3. NFA-Definition (AEF-Format)

### 3.1 Grundstruktur

```
# Kommentare beginnen mit #

# Metadaten (optional)
@NAME <Name>
@REGEX <Regulärer Ausdruck>

# Transitionen
<Zustand> -<Symbol>> <Zustand>;
```

### 3.2 Zustandsnotationen

**Wichtig:** Zustände müssen nur **einmal** markiert werden. Spätere Vorkommen ohne Markierung werden korrekt erkannt.

**Startzustand (.):**
```
.q0 -a> q1;
q0 -b> q2;    # q0 bleibt Startzustand (ohne Punkt)
```
Punkt vor dem Zustandsnamen markiert den Startzustand.

**Akzeptierender Zustand (()):**
```
q0 -a> (q1);
q1 -b> q2;    # q1 bleibt Akzeptierend (ohne Klammern)
```
Klammern um den Zustandsnamen markieren Akzeptanz.

**Start- und Akzeptierender Zustand ((.)):**
```
(.q0) -a> q1;
```
Kombination beider Notationen.

**Normaler Zustand:**
```
q0 -a> q1;
```
Keine spezielle Notation.

### 3.3 Transitionen

**Einfache Transition:**
```
q0 -a> q1;
```

**Mehrere Symbole (Verkettung):**
```
q0 -a> q1 -b> q2 -c> (q3);
```

**Epsilon-Transition (ε):**
```
q0 -ε> q1;
```
**Wichtig:** Verwenden Sie das Unicode-Zeichen `ε`, nicht das Wort "epsilon".

**Mehrere Transitionen zu gleichem Zielzustand:**
```
q0 -a> q1;
q0 -b> q1;
```
Wird automatisch zusammengefasst zu einer Kante mit Label `{a,b}`.

**Self-Loop:**
```
q0 -a> q0;
```

### 3.4 Vollständiges Beispiel

```
# @NAME Example: (a|b)*c
# @REGEX (a|b)*c

# Start in q0, kann a oder b lesen
.q0 -a> q1;
.q0 -b> q1;

# Aus q1 zurück zu q0 (Loop)
q1 -ε> q0;

# Aus q1 mit c zu q2 (akzeptierend)
q1 -c> q2 -ε> (q3);
```

---

## 4. Datei-Upload

### 4.1 Unterstützte Formate

| Format | Beschreibung | Beispiel |
|--------|--------------|----------|
| `.aef` | Automaton Exchange Format | `nfa.aef` |
| `.dsl` | Domain Specific Language | `nfa.dsl` |
| `.txt` | Text-Datei | `nfa.txt` |

### 4.2 Best Practices

**Ein Automat pro Datei:**  
Jede Datei sollte **genau einen NFA** enthalten. Mehrere Automaten in einer Datei werden nicht unterstützt.

### 4.3 Größenbeschränkung

**Maximum:** 1 MB (1.048.576 Bytes)

Größere Dateien werden mit folgender Fehlermeldung abgelehnt:
```
Datei ist zu groß (X.XX MB). Maximale Größe: 1 MB
```

### 4.4 Upload-Prozess

1. Klicken Sie auf "📁 Datei hochladen"
2. Wählen Sie eine `.aef`/`.dsl`/`.txt` Datei (ein Automat pro Datei)
3. Der Inhalt wird automatisch in den Textbereich geladen
4. Klicken Sie "▶ NFA laden" zum Parsen

---

## 5. Beispiele verwenden

### 5.1 Verfügbare Beispiele

1. **Example NFA - mit ε**
   - Zeigt Epsilon-Transitionen
   - Regulärer Ausdruck: `(1.(0.1)+)|(0.0)`

2. **Weitere Beispiele** (je nach Installation)
   - Verschiedene Komplexitätsstufen
   - Edge Cases und Sonderfälle

### 5.2 Beispiel laden

1. Öffnen Sie das Dropdown "📋 Beispiel laden"
2. Wählen Sie ein Beispiel aus
3. Der Code wird automatisch geladen und angezeigt

---

## 6. Graph-Visualisierung

### 6.1 Visuelle Elemente

**Zustände (Knoten):**

| Darstellung | Bedeutung |
|-------------|-----------|
| Bold Border | Startzustand |
| Double Border | Akzeptierender Zustand |
| Bold + Double | Start- und Akzeptierender Zustand |

**Kanten (Transitionen):**

| Stil | Bedeutung |
|------|-----------|
| Durchgezogen | Normale Transition |
| Gestrichelt | Epsilon-Transition (ε) |
| Gebogen | Rückkanten oder mehrfache Verbindungen |

### 6.2 Navigation

**Zoom:**
- Mausrad oder Pinch-Geste
- Zoom-Buttons in der Steuerung

**Pan (Verschieben):**
- Klicken und Ziehen im leeren Bereich
- Pfeiltasten (falls aktiviert)

**Fit View:**
- Passt den gesamten Graph in die Ansicht
- Button in der Steuerung

**MiniMap:**
- Übersichtskarte in der Ecke
- Zeigt Position im Graph

---

## 7. Fehlermeldungen

### 7.1 Parser-Fehler

**Fehlendes Semikolon:**
```
❌ Fehler in Zeile 5: Zeile muss mit ';' enden
q0 -a> q1
```
**Lösung:** Fügen Sie ein Semikolon am Ende hinzu.

**Kein Startzustand:**
```
❌ Fehler: NFA muss genau einen Startzustand haben (mit . markiert)
```
**Lösung:** Markieren Sie einen Zustand mit `.q0`

**Kein akzeptierender Zustand:**
```
❌ Fehler: NFA muss mindestens einen akzeptierenden Zustand haben
```
**Lösung:** Markieren Sie einen Zustand mit `(q1)`

**Leerzeichen in Zuständen:**
```
❌ Fehler in Zeile 4: Aufeinanderfolgende Zustände ohne Symbol
.q0 q1 -a> q2
```
**Lösung:** Entfernen Sie Leerzeichen: `.q0 -a> q1`

### 7.2 Upload-Fehler

**Datei zu groß:**
```
❌ Datei ist zu groß (2.50 MB). Maximale Größe: 1 MB
```
**Lösung:** Reduzieren Sie die Dateigröße oder teilen Sie den NFA.

**Lesefehler:**
```
❌ Fehler beim Lesen der Datei
```
**Lösung:** Überprüfen Sie Dateiberechtigungen und Format.

---

## 8. Häufige Probleme (FAQ)

### 8.1 "Graph wird nicht angezeigt"

**Mögliche Ursachen:**
1. Parser-Fehler in der Definition
2. Keine Transitionen vorhanden
3. Browser-Kompatibilitätsproblem

**Lösung:**
- Überprüfen Sie die Konsole (F12) auf Fehler
- Validieren Sie die AEF-Syntax
- Verwenden Sie einen unterstützten Browser

### 8.2 "Epsilon-Symbol funktioniert nicht"

**Problem:**
```
q0 -epsilon> q1;  ❌ Falsch
```

**Lösung:**
```
q0 -ε> q1;  ✅ Richtig
```

Verwenden Sie das Unicode-Zeichen `ε` (U+03B5).

**Eingabe:**
- **Windows:** Alt + 238 (Numpad)
- **Mac:** Option + E, dann E
- **Linux:** Ctrl + Shift + U, dann 03B5
- **Kopieren:** ε

### 8.3 "Graph ist zu groß/unübersichtlich"

**Lösungen:**
1. Verwenden Sie Zoom-Out
2. Nutzen Sie die MiniMap zur Orientierung
3. Vereinfachen Sie den NFA (weniger Zustände)

### 8.4 "Performance-Probleme bei großen NFAs"

**Empfehlung:**
- Maximale Zustände: ~50
- Maximale Transitionen: ~100
- Bei größeren Automaten: Teilen Sie in Teilautomaten

---

## 9. Beispiele und Übungen

### 9.1 Einfaches Beispiel

**Aufgabe:** NFA für den regulären Ausdruck `ab*c`

**Lösung:**
```
# @NAME Simple ab*c
# @REGEX ab*c

.q0 -a> q1 -b> q1;
q1 -c> (q2);
```

### 9.2 Mit Epsilon-Transitionen

**Aufgabe:** NFA für `(a|b)*`

**Lösung:**
```
# @NAME (a|b)*
# @REGEX (a|b)*

.q0 -a> q1 -ε> .q0;
.q0 -b> (q2) -ε> .q0;
```

### 9.3 Komplexes Beispiel

**Aufgabe:** NFA für `(0|1)*101`

**Lösung:**
```
# @NAME Binary 101 Pattern
# @REGEX (0|1)*101

.q0 -0> q0;
.q0 -1> q0;
.q0 -1> q1 -0> q2 -1> (q3);
```

---

## 10. Tastenkombinationen

| Taste | Funktion |
|-------|----------|
| Ctrl + Enter | NFA laden |
| Ctrl + Z | Rückgängig (im Textfeld) |
| Ctrl + Y | Wiederholen (im Textfeld) |
| Ctrl + + | Zoom In (Graph) |
| Ctrl + - | Zoom Out (Graph) |
| Ctrl + 0 | Zoom Reset (Graph) |

---

## 11. Tipps und Best Practices

### 11.1 Strukturierung

**✅ Gut:**
```
# Gruppierung nach Funktionalität

# Hauptschleife
.q0 -a> q1 -b> q0;

# Akzeptanz-Pfad
q1 -c> (q2);
```

**❌ Schlecht:**
```
.q0 -a> q1;
q1 -c> (q2);
q1 -b> q0;
```

### 11.2 Kommentare verwenden

```
# @NAME My NFA
# @REGEX (a|b)*c

# Startzustand: lese a oder b beliebig oft
.q0 -a> q1 -ε> .q0;
.q0 -b> q2 -ε> .q0;

# Akzeptiere nach c
q1 -c> (q3);
q2 -c> (q3);
```

### 11.3 Zustandsnamen

**✅ Gut:** `q0`, `q1`, `start`, `accept`  
**❌ Schlecht:** `q 0` (Leerzeichen), `q-1` (Bindestriche nur in Pfeilen)

---

## 12. Support und Feedback

**Bei Problemen:**
1. Überprüfen Sie diese Dokumentation
2. Schauen Sie in die Entwicklerdokumentation
3. Erstellen Sie ein Issue im GitLab-Repository

---

**Version:** 1.0  
**Letzte Aktualisierung:** Januar 2026
