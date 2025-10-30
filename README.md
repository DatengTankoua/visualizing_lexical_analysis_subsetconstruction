# Visualizing Lexer Stages: From NFA to DFA

Dieses Projekt visualisiert die schrittweise Umwandlung eines
**nichtdeterministischen endlichen Automaten (NFA)** in einen
**deterministischen endlichen Automaten (DFA)** mittels des
**Subset-Construction-Algorithmus** (auch Powerset-Construction genannt).

Das Ziel ist es, Studierenden den Ablauf und die Funktionsweise des Lexers
im Compilerbau verständlich zu machen.

---

## 🎯 Projektziele

- Einlesen eines NFAs aus einer **Domain-Specific Language (DSL)**
- Berechnung des entsprechenden DFA nach Spezifikation
- **Schritt-für-Schritt-Visualisierung** der Umwandlung (inkl. ε-Übergänge)
- Navigation durch die Berechnung:  
  **Start | Zurück | Weiter | Ende**
- Export des resultierenden DFA in der gleichen DSL
- Umsetzung als **lokale Webanwendung** (keine Serverabhängigkeit)

---

## 👥 Team

| Name | Rolle | Schwerpunkt | E-Mail |
|------|-------|------------|--------|
| Dateng Tankoua Emery Josian | Software-Engineering Team | Algorithmus, UI, Tests, Dokumentation | Datengta@students.uni-marburg.de |
| Zhang Ziyan | Software-Engineering Team | Algorithmus, UI, Tests, Dokumentation | Zhangzi@students.uni-marburg.de |
| M.Sc. Teresa Dreyer | Projektbetreuung & Evaluation | – | dreyert@staff.uni-marburg.de |

---

## 🛠️ Technologien

| Bereich | Tools |
|--------|-------|
| Framework | React + TypeScript (Vite) |
| UI | shadcn/ui |
| Visualisierung | ReactFlow, D3.js |
| Architektur | MVC-Pattern |
| Kollaboration | GitLab (Wiki, Issues, Merge-Requests) |
| Tests | Unit- & Integrationstests (TS/Jest/Vitest) |
| IDE | VS Code |

---

## 📁 Projektstruktur

```bash
src/
 ├── core/                  # Modelle & Algorithmus (NFA, DFA, Subset-Construction)
 ├── components/            # UI-Komponenten (Grafen, Buttons, Panels)
 ├── pages/                 # App-Seiten
 ├── utils/                 # Parser & Helper-Funktionen
 ├── App.tsx
 └── main.tsx
