# AEF Parser - Strikte Validierungsregeln

## Datum: 22. Dezember 2025

Der AEF-Parser wurde mit strikten Validierungsregeln erweitert, um sicherzustellen, dass nur korrekt formatierte NFAs akzeptiert werden.

## Validierungsregeln

### 1. Semikolon-Pflicht ✓
**Regel:** Jede Transitionszeile MUSS mit einem Semikolon (`;`) enden.

**Gültig:**
```aef
.q0 -a> q1;
```

**Ungültig:**
```aef
.q0 -a> q1
```

**Fehlermeldung:** *"Zeile muss mit Semikolon (;) enden. Gefunden: "..."*

---

### 2. Startzustand-Markierung ✓
**Regel:** Ein Startzustand MUSS mit einem Punkt (`.`) markiert werden.

**Gültig:**
```aef
.q0 -a> q1;
q1 -a> .q0;    # Startzustand kann überall sein
```

**Ungültig:**
```aef
q0 -a> q1;     # Kein Startzustand markiert
```

**Fehlermeldung:** *"Kein Startzustand definiert. Markieren Sie einen Zustand mit . (z.B. .q0)"*

---

### 3. Nur EIN Startzustand ✓
**Regel:** Es darf nur EINEN Startzustand im gesamten NFA geben.

**Gültig:**
```aef
.q0 -a> q1;
q1 -b> q2;
```

**Ungültig:**
```aef
.q0 -a> q1;
.q1 -b> q2;    # Zweiter Startzustand!
```

**Fehlermeldung:** *"Mehrere Startzustände gefunden: "q0" und "q1". Nur ein Startzustand ist erlaubt"*

---

### 4. Endzustand-Markierung ✓
**Regel:** Endzustände MÜSSEN in runden Klammern gesetzt werden: `(zustand)`

**Gültig:**
```aef
.q0 -a> (q1);
.q0 -a> q1 -b> (q2);    # Endzustand kann überall sein
```

**Ungültig:**
```aef
.q0 -a> q1;    # Kein Endzustand
```

**Fehlermeldung:** *"Keine akzeptierenden Zustände definiert. Setzen Sie mindestens einen Zustand in Klammern (z.B. (q2))"*

---

### 5. Start- UND Endzustand gleichzeitig: (.qi) Notation ✓
**Regel:** Ein Zustand kann sowohl Start- als auch Endzustand sein, wenn die Notation `(.zustand)` verwendet wird.

**Gültig:**
```aef
# Zustand q0 ist Start- UND Endzustand
(.q0) -a> q1;
(.q0) -b> (.q0);

# NFA akzeptiert Leerstring und beliebige a's und b's
(.q0) -a> (.q0);
(.q0) -b> (.q0);
```

**Ungültig (inkonsistente Notation):**
```aef
(.q0) -a> q1;
.q0 -b> q2;     # Gleicher Zustand mit unterschiedlicher Notation!
```

**Fehlermeldung:** *"Inkonsistente Notation für Zustand 'q0': zuerst als '(.q0)' in Zeile 1 deklariert, jetzt als '.q0' verwendet"*

**Hinweise:**
- Die `(.qi)` Notation kombiniert die Start-Markierung (`.`) mit der Endzustands-Markierung `()`
- Nützlich für NFAs, die den Leerstring akzeptieren
- Die Notation muss konsistent sein: wenn ein Zustand einmal als `(.q0)` deklariert wurde, muss er immer so verwendet werden

---

### 6. Symbol-Format: -symbol> ✓
**Regel:** Symbole MÜSSEN das Format `-symbol>` haben (ohne Leerzeichen).

**Gültig:**
```aef
.q0 -a> q1;
.q0 -ABC> q1;
.q0 -0> q1;
.q0 -ε> q1;
```

**Ungültig:**
```aef
.q0 -> q1;        # Leeres Symbol
.q0 -a q1;        # Fehlendes >
.q0 a> q1;        # Fehlendes -
.q0 - a > q1;     # Leerzeichen im Symbol
```

**Fehlermeldungen:**
- *"Ungültiges Format "->". Symbol darf nicht leer sein"*
- *"Ungültiges Symbol-Format gefunden. Erwartet: -symbol> (mit >)"*
- *"Ungültiges Symbol-Format gefunden. Symbol muss mit - beginnen: -symbol>"*

---

### 7. Nur ε für Epsilon ✓
**Regel:** Für Epsilon-Übergänge MUSS das Symbol `ε` verwendet werden, nicht das Wort "epsilon".

**Gültig:**
```aef
.q0 -ε> (q1);
```

**Ungültig:**
```aef
.q0 -epsilon> (q1);
```

**Fehlermeldung:** *"Verwenden Sie 'ε' statt 'epsilon' für Epsilon-Übergänge"*

---

### 8. Token-Trennung durch Leerzeichen ✓
**Regel:** Alle Tokens (Zustände, Symbole) MÜSSEN durch Leerzeichen getrennt sein.

**Gültig:**
```aef
.q0 -a> q1 -b> (q2);
```

**Ungültig:**
```aef
.q0-a>q1-b>(q2);    # Keine Leerzeichen
```

---

### 9. Zustandsnamen ohne Leerzeichen ✓
**Regel:** Zustandsnamen dürfen KEINE Leerzeichen enthalten.

**Gültig:**
```aef
.q0 -a> q1;
.state0 -a> state1;
.q_0 -a> q_1;
```

**Ungültig:**
```aef
.q 0 -a> q 1;
```

**Fehlermeldung:** *"Zustandsname darf keine Leerzeichen enthalten: "q 0""*

---

### 10. Gültige Zeichen in Zustandsnamen ✓
**Regel:** Zustandsnamen dürfen nur Buchstaben, Zahlen, Unterstriche und `∅` enthalten.

**Gültig:**
```aef
.q0 -a> q1;
.state_1 -a> state_2;
.q0 -a> q∅;
```

**Ungültig:**
```aef
.q-0 -a> q#1;
```

**Fehlermeldung:** *"Ungültiger Zustandsname: "q-0". Erlaubt sind nur Buchstaben, Zahlen, Unterstriche und ∅"*

---

### 11. Mindestanforderungen ✓
**Regeln:**
- Mindestens ein Zustand erforderlich
- Mindestens ein Endzustand erforderlich
- Mindestens eine Transition erforderlich

**Fehlermeldungen:**
- *"Keine Zustände definiert"*
- *"Keine akzeptierenden Zustände definiert"*
- *"Keine Transitionen definiert"*

---

### 12. Referenz-Validierung ✓
**Regel:** Alle referenzierten Zustände müssen existieren.

**Fehlermeldungen:**
- *"Startzustand "..." existiert nicht in der Zustandsliste"*
- *"Akzeptierender Zustand "..." existiert nicht in der Zustandsliste"*
- *"Transition verwendet unbekannten Zustand: "...""*

---

## Vollständiges Beispiel

### Korrektes AEF-Format
```aef
# @NAME Example_NFA
# @REGEX (a|b)*c

.q0 -a> q0;
q0 -b> q0;
q0 -c> (q1);
```

### Mit Epsilon-Übergängen
```aef
# @NAME NFA_mit_Epsilon
# @REGEX a*

.q0 -a> q1;
q1 -ε> (q2);
```

### Mit verketteten Transitionen
```aef
# @NAME Verkettete_Transitionen
# @REGEX abc

.q0 -a> q1 -b> q2 -c> (q3);
```

### Mehrere Symbole vom gleichen Zustand
```aef
# @NAME Multi_Symbol
# @REGEX (a|b)*

.q0 -a> -b> q0 -c> (q1);
```

### Start- und Endzustand kombiniert
```aef
# @NAME Combined_State
# @REGEX (a|b)*
# Akzeptiert auch Leerstring

(.q0) -a> (.q0);
(.q0) -b> (.q0);
```

---

## Fehlerbehandlung

Jeder Validierungsfehler enthält:
- ✓ Präzise Fehlerbeschreibung
- ✓ Zeilennummer (wo verfügbar)
- ✓ Kontext des Fehlers
- ✓ Hinweise zur Behebung

---

## Migration von Dateien

Wenn Sie AEF-Dateien haben:

1. **Semikolons hinzufügen:** Stellen Sie sicher, dass jede Zeile mit `;` endet
2. **Startzustände prüfen:** Nur EIN `.` im gesamten NFA
3. **"epsilon" ersetzen:** Verwenden Sie `ε` statt "epsilon"
4. **Leerzeichen prüfen:** Tokens müssen durch Leerzeichen getrennt sein
5. **Symbol-Format:** Stellen Sie sicher, dass Symbole `-symbol>` Format haben

---

## Tests

Umfassende Tests in: `tests/`

Teste mit:
```bash
npm test
```

---