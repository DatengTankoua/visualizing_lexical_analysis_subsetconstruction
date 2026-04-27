# Benutzerdokumentation: NFA Visualisierung

**Anwendung:** NFA/DFA Visualizer | **Version:** 1.1.0  
**Zielgruppe:** Studierende, Dozenten

---

## 1. Erste Schritte

**Entwicklungsumgebung:**
```bash
npm install && npm run dev
```
Öffnen Sie http://localhost:5173 im Browser.

**Unterstützte Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 2. Benutzeroberfläche

```

 ◑ HC  | Sprachauswahl (DE / EN)     oben rechts 

 DSL-Eingabe (AEF-Format)                        
  [ Beispiel laden  ]  [ Datei hochladen ]     
  [  NFA laden ]  [  DFA exportieren ]         

 Steuerung: [] [] [] [] [Auto-Play]             

 NFA-Graph               DFA-Graph              
 (nebeneinander)                                 

 DFA-Übergangstabelle                            

```

### High-Contrast-Modus

Der **◑ HC**-Button oben rechts schaltet den kontrastreichen Modus ein und aus.

| Zustand | Darstellung |
|---------|-------------|
| Aus (Standard) | Normale Farbdarstellung |
| Ein (aktiv, gelb) | Schwarz/Weiß/Gelb, alle Elemente kontrastreich |

**Nutzen:** Verbesserte Lesbarkeit für Personen mit Sehbeeinträchtigungen oder in ungünstigen Lichtverhältnissen. Der Modus erfüllt die Anforderungen an barriereame Webentwicklung (High-Contrast-Anforderung).

**Tastaturnavigation:** Im HC-Modus werden Fokus-Rahmen (gelb) deutlich hervorgehoben (`focus-visible`).

---

## 3. AEF-Format

### Grundstruktur

```
# @NAME   <Automatname>
# @REGEX  <regulärer Ausdruck>

.q0 -a> q1 -b> (q2);
q0 -ε> q3;
```

### Zustandsnotationen

| Notation | Bedeutung | Beispiel |
|----------|-----------|---------|
| `.q0` | Startzustand | `.q0 -a> q1;` |
| `(q2)` | Akzeptierender Zustand | `q1 -b> (q2);` |
| `(.q0)` | Start + Akzeptierend | `(.q0) -a> q1;` |
| `q1` | Normaler Zustand | `q0 -a> q1;` |

**Wichtig:** Zustände müssen nur **einmal** markiert werden. Spätere Vorkommen ohne Markierung werden korrekt erkannt.

### Transitionen

```
q0 -a> q1;                    # Einfache Transition
q0 -a> q1 -b> q2 -c> (q3);   # Mehrere Symbole (Verkettung)
q0 -ε> q1;                    # Epsilon-Transition (Unicode: ε)
q0 -a> q0;                    # Self-Loop
```

### Vollständiges Beispiel

```
# @NAME Binary 101 Pattern
# @REGEX (0|1)*101

.q0 -0> q0;
.q0 -1> q0;
.q0 -1> q1 -0> q2 -1> (q3);
```

---

## 4. NFA laden

### Manuell eingeben
Tippen Sie direkt im Textbereich und klicken Sie **" NFA laden"**.

### Datei hochladen
1. Klicken Sie auf **" Datei hochladen"**
2. Wählen Sie `.aef`, `.dsl` oder `.txt` (max. 1 MB, ein Automat pro Datei)
3. Klicken Sie **" NFA laden"**

### Beispiel laden
Öffnen Sie das Dropdown **" Beispiel laden"** und wählen Sie ein Beispiel.

**Verfügbare Beispiele:**
- *Example NFA  mit ε*: Regex `(1.(0.1)+)|(0.0)`, zeigt Epsilon-Transitionen
- *Example NFA  ohne ε*: NFA ohne Epsilon, direkt einsatzbereit

---

## 5. Graph-Visualisierung

### Visuelle Elemente

| Darstellung | Bedeutung |
|-------------|-----------|
| Fett umrandet | Startzustand |
| Doppelt umrandet | Akzeptierender Zustand |
| Fett + Doppelt | Start- und Akzeptierend |
| Durchgezogene Kante | Normale Transition |
| Gestrichelte Kante | Epsilon-Transition |

### Navigation
- **Zoom:** Mausrad oder Zoom-Buttons
- **Verschieben:** Klicken & Ziehen
- **Alles zeigen:** Fit-View-Button

---

## 6. Schrittweise Visualisierung

Über die Steuerleiste können Sie die Subset Construction Schritt für Schritt nachvollziehen:

| Button | Funktion |
|--------|----------|
|  | Zum Anfang |
|  | Schritt zurück |
|  | Schritt vor |
|  | Zum Ende |
| Auto-Play | Automatische Wiedergabe |

Die **DFA-Übergangstabelle** zeigt den aktuellen Zustand farblich hervorgehoben.

---

## 7. DFA-Wortsimulation(Zusatzanforderung)

### Eingabe

Der Benutzer kann ein Wort (z. B. `101`) in das Eingabefeld über dem DFA-Graphen eingeben.

### Steuerung

| Button | Funktion |
|--------|----------|
| Start | Startet die Simulation |
| Next | Geht einen Schritt weiter |
| Back | Geht einen Schritt zurück |
| Reset | Setzt die Simulation zurück |

### Visualisierung

Während der Simulation werden zwei Dinge gleichzeitig dargestellt:

- Der aktuelle Zustand wird im DFA-Graph hervorgehoben  
- Der Fortschritt im Wort wird angezeigt:
  - Grau: bereits verarbeitet  
  - Gelb: aktuelles Symbol  
  - Schwarz: verbleibend  

### Ergebnis

Nach der Simulation wird angezeigt, ob das Wort akzeptiert oder abgelehnt wird.

- **Accepted**: Endzustand ist akzeptierend
- **Rejected**: Kein akzeptierender Zustand erreicht oder Simulation bricht ab

### Fehlermeldungen

Falls für ein Symbol keine Transition existiert, wird die Simulation vorzeitig beendet.

---

## 8. DFA-Export

Nach erfolgreicher Konvertierung kann der DFA als `.aef`-Datei heruntergeladen werden.

**Voraussetzung:** Der NFA-Quelltext muss `@NAME` und `@REGEX` enthalten.

```
# @NAME MeinAutomat
# @REGEX ab*c

.q0 -a> q1 -b> q1;
q1 -c> (q2);
```

**Schritte:**
1. NFA mit `@NAME` und `@REGEX` laden
2. DFA wird automatisch berechnet
3. Klicken Sie **" DFA exportieren"**
4. Datei wird als `<Name>.aef` heruntergeladen

---

## 9. Fehlermeldungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| `Zeile muss mit ';' enden` | Fehlendes Semikolon | `;` am Zeilenende ergänzen |
| `NFA muss genau einen Startzustand haben` | Kein `.` vorhanden | Einen Zustand mit `.q0` markieren |
| `NFA muss mindestens einen akzeptierenden Zustand haben` | Kein `()` vorhanden | Einen Zustand mit `(q1)` markieren |
| `Aufeinanderfolgende Zustände ohne Symbol` | Leerzeichen in Zustandsnamen | `.q0 q1`  `.q0 -a> q1` |
| `Datei ist zu groß (X MB). Maximale Größe: 1 MB` | Datei überschreitet Limit | Datei verkleinern |

**Epsilon-Symbol-Fehler:**
```
q0 -epsilon> q1;      q0 -ε> q1;  
```
Verwenden Sie das Unicode-Zeichen `ε` (U+03B5), nicht das Wort "epsilon".
Eingabe: Windows `Alt+238` (Numpad)  Mac `Option+E, E`  oder kopieren: **ε**

---

**Version:** 1.1.0 | **Letzte Aktualisierung:** März 2026  
**Kontakt:** Datengta@students.uni-marburg.de  Zhangzi@students.uni-marburg.de
