# Manuelle Test-Dokumentation: NFA Visualisierung

**Projekt:** Visualizing Lexical Analysis - Subset Construction  
**Version:** 1.0.0  
**Datum:** Januar 2026

---

## 1. Überblick

Dieses Dokument beschreibt manuelle Test-Szenarien für die NFA-Visualisierungs-Anwendung. Diese Tests ergänzen die automatisierten Unit- und Component-Tests und fokussieren sich auf End-to-End-Benutzerinteraktionen.

### 1.1 Testziele

- Validierung der Benutzeroberfläche und Interaktionen
- Überprüfung der Fehlerbehandlung und Fehlermeldungen
- Testen von Edge Cases, die schwer automatisiert testbar sind
- Visuelles Feedback und Layout-Überprüfung

### 1.2 Testumgebung

**Browser:**
- Chrome 120+ (primär)
- Firefox 120+ (sekundär)
- Edge 120+ (optional)

**Auflösungen:**
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024

---

## 2. Test-Szenarien: DSL-Eingabe

### Test 2.1: Manuelle Texteingabe

**Ziel:** Überprüfe, dass manuell eingegebene NFAs korrekt geparst werden.

**Schritte:**
1. Öffne die Anwendung (`http://localhost:5173`)
2. Lösche Platzhalter-Text im Textfeld
3. Gebe folgenden Code ein:
   ```
   # @NAME Simple_Test
   # @REGEX a*b
   
   .q0 -a> q1 -b> (q2);
   ```
4. Klicke auf "🚀 NFA laden"

**Expected Result:**
- ✅ Keine Fehlermeldung erscheint
- ✅ Graph wird unterhalb angezeigt
- ✅ 3 Zustände sichtbar: q0, q1, q2
- ✅ q0 hat grünen Hintergrund (Start)
- ✅ q2 hat doppelten Rand (Accept)
- ✅ 2 Kanten mit Labels "a" und "b"

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 2.2: Beispiel laden

**Ziel:** Überprüfe, dass Beispiele korrekt geladen werden.

**Schritte:**
1. Öffne die Anwendung
2. Klicke auf Dropdown "📁 Beispiel laden"
3. Wähle "Example NFA - mit ε"
4. Warte auf Ladevorgang (max 2 Sekunden)

**Expected Result:**
- ✅ Textfeld wird mit Beispiel-Code gefüllt
- ✅ Code enthält `@NAME`, `@REGEX` Metadaten
- ✅ Code enthält Epsilon-Transitionen (`-ε>`)
- ✅ Mindestens 5 Zeilen Code sichtbar

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 2.3: Datei hochladen (< 1 MB)

**Ziel:** Überprüfe, dass .aef Dateien korrekt hochgeladen werden.

**Schritte:**
1. Erstelle eine Test-Datei `test.aef` mit Inhalt:
   ```
   .q0 -a> (q1);
   ```
2. Klicke auf "📤 Datei hochladen"
3. Wähle `test.aef` aus
4. Überprüfe Textfeld

**Expected Result:**
- ✅ Dateiinhalt erscheint im Textfeld
- ✅ Keine Fehlermeldung
- ✅ Dateiname nicht sichtbar (nur Inhalt)

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 2.4: Datei hochladen (> 1 MB) - Fehlerszenario

**Ziel:** Überprüfe Dateigrößen-Validierung.

**Schritte:**
1. Erstelle eine große Datei (> 1 MB):
   ```powershell
   # Windows PowerShell
   1..50000 | ForEach-Object { ".q$_ -a> (q$($_ + 1));" } | Out-File large.aef
   ```
2. Versuche diese Datei hochzuladen
3. Überprüfe Fehlermeldung

**Expected Result:**
- ✅ Fehlermeldung erscheint unterhalb des Upload-Feldes
- ✅ Text: "Datei ist zu groß (X.XX MB). Maximale Größe: 1 MB"
- ✅ Textfeld bleibt unverändert
- ✅ Fehlermeldung verschwindet nach 5 Sekunden

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

## 3. Test-Szenarien: Parser-Validierung

### Test 3.1: Fehlendes Semikolon

**Ziel:** Überprüfe Fehlerberichterstattung bei Syntaxfehlern.

**Schritte:**
1. Gebe ein:
   ```
   .q0 -a> (q1)
   ```
   (Beachte: Kein Semikolon am Ende)
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung erscheint (rot markiert)
- ✅ Text enthält: "Zeile muss mit Semikolon (;) enden"
- ✅ Zeilennummer wird angezeigt: "Zeile 1"
- ✅ Kein Graph wird angezeigt

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 3.2: Fehlender Startzustand

**Ziel:** Überprüfe Validierung von Startzustand.

**Schritte:**
1. Gebe ein:
   ```
   q0 -a> (q1);
   ```
   (Beachte: Kein Punkt vor q0)
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Kein Startzustand definiert. Markieren Sie einen Zustand mit . (z.B. .q0)"
- ✅ Kein Graph wird angezeigt

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 3.3: Fehlender Akzeptierender Zustand

**Ziel:** Überprüfe Validierung von Endzuständen.

**Schritte:**
1. Gebe ein:
   ```
   .q0 -a> q1;
   ```
   (Beachte: Keine Klammern um q1)
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Keine akzeptierenden Zustände definiert. Setzen Sie mindestens einen Zustand in Klammern (z.B. (q2))"
- ✅ Kein Graph wird angezeigt

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 3.4: Mehrere Startzustände - Fehlerszenario

**Ziel:** Überprüfe, dass nur ein Startzustand erlaubt ist.

**Schritte:**
1. Gebe ein:
   ```
   .q0 -a> q1;
   .q2 -b> (q3);
   ```
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Mehrere Startzustände gefunden"
- ✅ Zeigt beide Zustandsnamen: "q0" und "q2"
- ✅ Kein Graph wird angezeigt

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 3.5: Inkonsistente Zustandsnotation

**Ziel:** Überprüfe Konsistenz-Validierung.

**Schritte:**
1. Gebe ein:
   ```
   .q0 -a> q1;
   q0 -b> (q2);
   ```
   (Beachte: q0 einmal mit Punkt, einmal ohne)
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Inkonsistente Notation für Zustand 'q0'"
- ✅ Zeigt beide Notationen: ".q0" und "q0"
- ✅ Zeigt beide Zeilennummern

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 3.6: Epsilon mit "epsilon" statt ε

**Ziel:** Überprüfe Epsilon-Validierung.

**Schritte:**
1. Gebe ein:
   ```
   .q0 -epsilon> (q1);
   ```
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Verwenden Sie 'ε' statt 'epsilon'"
- ✅ Kein Graph wird angezeigt

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 3.7: Symbol nicht in Regex (Neue Validierung)

**Ziel:** Überprüfe Regex-Symbol-Validierung.

**Schritte:**
1. Gebe ein:
   ```
   # @NAME Test
   # @REGEX (a|b)*
   
   .q0 -a> q1 -x> (q2);
   ```
   (Beachte: Symbol "x" nicht in Regex)
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: 'Symbol "x" wird in Transitionen verwendet, kommt aber nicht in der Regex vor'
- ✅ Zeigt Regex: "(a|b)*"
- ✅ Zeigt erlaubte Symbole: "a, b"
- ✅ Kein Graph wird angezeigt

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

## 4. Test-Szenarien: Graph-Visualisierung

### Test 4.1: Einfacher NFA

**Ziel:** Überprüfe Basis-Visualisierung.

**Schritte:**
1. Lade folgenden NFA:
   ```
   .q0 -a> q1 -b> (q2);
   ```
2. Warte auf Graph-Rendering

**Expected Result:**
- ✅ 3 Knoten sichtbar in horizontaler Linie
- ✅ q0: Grüner Hintergrund + "START" Label
- ✅ q2: Doppelter blauer Rand + "ACCEPT" Label
- ✅ 2 Kanten mit Pfeilen
- ✅ Kanten-Labels: "a" und "b" (weißer Hintergrund)
- ✅ MiniMap unten rechts sichtbar
- ✅ Zoom-Controls oben rechts sichtbar

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 4.2: Self-Loop

**Ziel:** Überprüfe Self-Loop-Darstellung.

**Schritte:**
1. Lade:
   ```
   (.q0) -a> .q0;
   ```
2. Beobachte Graph

**Expected Result:**
- ✅ 1 Knoten (q0)
- ✅ Knoten hat grünen Hintergrund (Start) UND doppelten Rand (Accept)
- ✅ Pfeil geht von q0 zurück zu q0 (Schleife)
- ✅ Schleife ist gebogen (nicht gerade)
- ✅ Label "a" auf der Schleife

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 4.3: Epsilon-Transitionen

**Ziel:** Überprüfe Epsilon-Darstellung.

**Schritte:**
1. Lade:
   ```
   .q0 -a> q1 -ε> (q2);
   ```
2. Fokussiere auf Epsilon-Kante

**Expected Result:**
- ✅ Kante zwischen q1 und q2 ist **gestrichelt**
- ✅ Label zeigt "ε" (nicht "epsilon")
- ✅ Kante ist animiert (fließende Punkte)

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 4.4: Mehrfache Transitionen zwischen Zuständen

**Ziel:** Überprüfe Edge-Merging.

**Schritte:**
1. Lade:
   ```
   .q0 -a> q1;
   .q0 -b> q1;
   q1 -c> (q2);
   ```
2. Beobachte Kante zwischen q0 und q1

**Expected Result:**
- ✅ Nur **eine** Kante zwischen q0 und q1
- ✅ Label zeigt **"{a,b}"** (geschweifte Klammern)
- ✅ Symbole alphabetisch sortiert

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 4.5: Sprungkante (dist > 1)

**Ziel:** Überprüfe Darstellung von Sprungkanten.

**Schritte:**
1. Lade:
   ```
   .q0 -a> q1 -b> q2;
   .q0 -c> (q2);
   ```
   (Beachte: q0 → q2 überspringt q1)
2. Beobachte Kante von q0 zu q2

**Expected Result:**
- ✅ Kante q0 → q2 ist stark **gebogen nach oben**
- ✅ Kante überschneidet nicht mit q1
- ✅ Label "c" klar lesbar

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 4.6: Reverse-Paare (Bidirektionale Kanten)

**Ziel:** Überprüfe Darstellung von Hin- und Rückkanten.

**Schritte:**
1. Lade:
   ```
   .q0 -a> q1;
   q1 -b> .q0;
   q1 -c> (q2);
   ```
2. Beobachte Kanten zwischen q0 und q1

**Expected Result:**
- ✅ Zwei separate Kanten sichtbar
- ✅ Eine Kante oben (q0 → q1)
- ✅ Eine Kante unten (q1 → q0)
- ✅ Kanten überlappen nicht
- ✅ Labels "a" und "b" klar zuordenbar

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 4.7: Komplexer NFA (Example NFA)

**Ziel:** Überprüfe Rendering eines komplexen NFAs.

**Schritte:**
1. Lade Beispiel "Example NFA - mit ε"
2. Klicke "🚀 NFA laden"
3. Warte auf vollständiges Rendering

**Expected Result:**
- ✅ 7 Zustände sichtbar
- ✅ Mindestens 8 Kanten
- ✅ Gestrichelte Epsilon-Kante sichtbar
- ✅ Layout ist übersichtlich (keine Überlappungen)
- ✅ Alle Labels lesbar
- ✅ MiniMap zeigt Gesamt-Layout
- ✅ Fit-View funktioniert (gesamter Graph sichtbar)

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

## 5. Test-Szenarien: Interaktivität

### Test 5.1: Zoom In/Out

**Ziel:** Überprüfe Zoom-Funktionalität.

**Schritte:**
1. Lade einen NFA
2. Klicke auf "+" Button (Zoom In) 3x
3. Klicke auf "-" Button (Zoom Out) 3x
4. Verwende Mausrad zum Zoomen

**Expected Result:**
- ✅ Graph wird größer/kleiner
- ✅ Proportionen bleiben erhalten
- ✅ Mausrad funktioniert
- ✅ Zoom-Level begrenzt (max/min)

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 5.2: Pan (Verschieben)

**Ziel:** Überprüfe Pan-Funktionalität.

**Schritte:**
1. Lade einen NFA
2. Klicke und ziehe im leeren Bereich
3. Verschiebe Graph in alle Richtungen

**Expected Result:**
- ✅ Graph folgt Mausbewegung
- ✅ Reibungslos ohne Verzögerung
- ✅ MiniMap zeigt aktuelle Position

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 5.3: Fit View

**Ziel:** Überprüfe Fit-View-Funktion.

**Schritte:**
1. Lade einen NFA
2. Zoome stark rein
3. Verschiebe Graph aus Sicht
4. Klicke "Fit View" Button (⊞)

**Expected Result:**
- ✅ Gesamter Graph wird wieder sichtbar
- ✅ Zoom passt sich automatisch an
- ✅ Graph zentriert

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

### Test 5.4: MiniMap Navigation

**Ziel:** Überprüfe MiniMap-Interaktion.

**Schritte:**
1. Lade einen großen NFA (Example NFA)
2. Zoome stark rein (nur Teil des Graphs sichtbar)
3. Klicke in MiniMap an verschiedenen Stellen

**Expected Result:**
- ✅ Haupt-View springt zu geklickter Position
- ✅ MiniMap zeigt aktuellen Viewport (weißes Rechteck)
- ✅ Alle Knoten in MiniMap sichtbar (miniaturisiert)

**Actual Result:**
- [ ] Pass
- [ ] Fail (Beschreibung: _____________)

---

## 6. Edge Cases

### Test 6.1: Leere Eingabe

**Schritte:**
1. Lösche gesamten Text im Textfeld
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Bitte geben Sie eine DSL-Definition ein"
- ✅ Kein Graph

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 6.2: Nur Kommentare

**Schritte:**
1. Gebe nur Kommentare ein:
   ```
   # Dies ist ein Kommentar
   # Noch ein Kommentar
   ```
2. Klicke "🚀 NFA laden"

**Expected Result:**
- ✅ Fehlermeldung: "Keine Transitionen gefunden"

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 6.3: Sehr langer Zustandsname

**Schritte:**
1. Gebe ein:
   ```
   .q0_very_long_state_name_test -a> (q1);
   ```
2. Lade NFA

**Expected Result:**
- ✅ Funktioniert korrekt
- ✅ Langer Name wird im Graph angezeigt (evtl. abgeschnitten)

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 6.4: Umlaute in Metadaten

**Schritte:**
1. Gebe ein:
   ```
   # @NAME Automat_für_Äöü
   # @REGEX äöü
   
   .q0 -ä> (q1);
   ```
2. Lade NFA

**Expected Result:**
- ✅ Funktioniert korrekt
- ✅ Name mit Umlauten wird akzeptiert

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 6.5: 50 Zustände (Performance-Test)

**Schritte:**
1. Erstelle NFA mit 50 Zuständen:
   ```
   .q0 -a> q1;
   q1 -a> q2;
   ...
   q49 -a> (q50);
   ```
2. Lade NFA
3. Beobachte Rendering-Zeit

**Expected Result:**
- ✅ Rendering in < 3 Sekunden
- ✅ Graph ist lesbar
- ✅ Kein Browser-Freeze
- ✅ Zoom/Pan funktioniert flüssig

**Actual Result:**
- [ ] Pass / [ ] Fail
- Rendering-Zeit: _______ Sekunden

---

## 7. Browser-Kompatibilität

### Test 7.1: Chrome

**Browser:** Chrome 120+

**Schritte:**
1. Führe Tests 2.1, 3.1, 4.1, 5.1 durch

**Expected Result:**
- ✅ Alle Tests bestehen
- ✅ Keine Konsolen-Fehler

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 7.2: Firefox

**Browser:** Firefox 120+

**Schritte:**
1. Führe Tests 2.1, 3.1, 4.1, 5.1 durch

**Expected Result:**
- ✅ Alle Tests bestehen
- ✅ Keine Konsolen-Fehler

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 7.3: Edge

**Browser:** Edge 120+

**Schritte:**
1. Führe Tests 2.1, 3.1, 4.1, 5.1 durch

**Expected Result:**
- ✅ Alle Tests bestehen
- ✅ Keine Konsolen-Fehler

**Actual Result:**
- [ ] Pass / [ ] Fail

---

## 8. Responsive Design

### Test 8.1: Desktop (1920x1080)

**Schritte:**
1. Öffne Anwendung in Full HD
2. Lade einen NFA
3. Überprüfe Layout

**Expected Result:**
- ✅ Textfeld nimmt ~50% der Breite
- ✅ Graph ist groß und gut lesbar
- ✅ Alle Buttons sichtbar

**Actual Result:**
- [ ] Pass / [ ] Fail

---

### Test 8.2: Laptop (1366x768)

**Schritte:**
1. Setze Browser-Größe auf 1366x768
2. Lade einen NFA
3. Überprüfe Layout

**Expected Result:**
- ✅ Layout passt sich an
- ✅ Keine horizontalen Scrollbars
- ✅ Graph bleibt lesbar

**Actual Result:**
- [ ] Pass / [ ] Fail

---

## 9. Test-Zusammenfassung

### Statistiken

| Kategorie | Geplant | Bestanden | Fehlgeschlagen | Übersprungen |
|-----------|---------|-----------|----------------|--------------|
| DSL-Eingabe | 4 | | | |
| Parser-Validierung | 7 | | | |
| Graph-Visualisierung | 7 | | | |
| Interaktivität | 4 | | | |
| Edge Cases | 5 | | | |
| Browser-Kompatibilität | 3 | | | |
| Responsive Design | 2 | | | |
| **Gesamt** | **32** | | | |

### Kritische Fehler

_(Liste kritischer Fehler, die sofort behoben werden müssen)_

1. 
2. 
3. 

### Kleinere Probleme

_(Liste kleinerer Probleme oder Verbesserungsvorschläge)_

1. 
2. 
3. 

---

## 10. Anhang

### A. Test-Dateien

**Datei: `test_simple.aef`**
```
.q0 -a> (q1);
```

**Datei: `test_complex.aef`**
```
# @NAME Complex_Test
# @REGEX (a|b)*c

.q0 -a> q1 -b> q2;
q1 -ε> .q0;
q2 -c> (q3);
```

### B. Häufige Probleme

| Problem | Ursache | Lösung |
|---------|---------|---------|
| Graph nicht sichtbar | Parser-Fehler | Überprüfe Konsole (F12) |
| Zoom funktioniert nicht | Browser-Zoom aktiv | Setze Browser-Zoom auf 100% |
| Beispiel lädt nicht | Server nicht gestartet | Starte `npm run dev` |

### C. Checkliste vor Abgabe

- [ ] Alle 32 Tests durchgeführt
- [ ] Mindestens 90% bestanden
- [ ] Kritische Fehler dokumentiert
- [ ] Screenshots von Fehlern erstellt
- [ ] Browser-Konsole überprüft (keine Fehler)
- [ ] Performance akzeptabel (< 3s Rendering)

---

**Getestet von:** _________________  
**Datum:** _________________  
**Version:** _________________
