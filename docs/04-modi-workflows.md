# Die 3 Pipeline-Modi

Die Pipeline hat drei Betriebsmodi die verschiedene Anwendungsfälle abdecken.

---

## Modus 1: Auto (bei jedem Push / PR)

**Wann:** Automatisch bei jedem Push auf `main` und bei jedem Pull Request.

**Was passiert:**
1. Alle 5 Jobs laufen durch (Gitleaks, npm audit, Semgrep, ESLint, Knip)
2. Ergebnisse erscheinen in der **GitHub Actions Summary** des Commits/PRs
3. Bei kritischen Findings (besonders Gitleaks) schlägt der Job fehl → roter Status beim PR
4. HTML-Report wird als Artifact gespeichert (90 Tage verfügbar)

**Kein Auto-Fix** — der Code wird nicht verändert. Nur Analyse.

**Sinn dahinter:** Jeder Commit wird geprüft. Du merkst sofort wenn ein neues Paket eine Schwachstelle mitbringt oder versehentlich ein Secret committed wurde.

**Wo sichtbar:** GitHub → Repo → Tab "Actions" → "Security Pipeline" → letzter Run

---

## Modus 2: Scan (manueller "Knopfdruck")

**Wann:** Manuell ausgelöst — z.B. vor einer Kundenlieferung oder monatlich für den Kundenbericht.

**Wie auslösen:**
1. GitHub → Kundenprojekt-Repo → Tab **"Actions"**
2. Links: "Security Pipeline" auswählen
3. Rechts oben: **"Run workflow"** Button klicken
4. `mode`: `scan` auswählen
5. `project_name`: Projektname für den Report eintragen (erscheint im Kundenbericht)
6. **"Run workflow"** bestätigen

**Was passiert:**
- Identisch mit Auto-Modus, aber manuell ausgelöst
- HTML-Report bekommt den eingetragenen `project_name`
- Artifact ist 90 Tage downloadbar

**Wofür:** Monatlicher Sicherheitsbericht für den Kunden. Du lädst das HTML-Artifact herunter und schickst es per E-Mail oder Kundenportal. Es enthält bereits die DSGVO §32-Attestierung.

---

## Modus 3: Fix (Auto-Fix + PR)

**Wann:** Wenn du Sicherheitsprobleme automatisch beheben lassen willst.

**Wie auslösen:**
1. GitHub → Kundenprojekt-Repo → Tab **"Actions"**
2. "Security Pipeline" → **"Run workflow"**
3. `mode`: **`fix`** auswählen
4. **"Run workflow"** bestätigen

**Was passiert (in dieser Reihenfolge):**
1. Alle Scan-Jobs laufen durch (wie immer)
2. Zusätzlich: Job `create-fix-pr` startet:
   - `npm audit fix` → patcht Dependency-CVEs ohne Breaking Changes
   - `eslint --fix` → behebt automatisch behebbare Code-Issues
3. GitHub erstellt automatisch einen neuen Branch: `security/auto-fix-XXXXX`
4. Ein **Pull Request** wird eröffnet mit Titel: `[Security] Auto-Fix: Vulnerabilities & Linting`

**Was du dann tust:**
1. PR in GitHub öffnen
2. Diff prüfen: Welche `package.json`/`package-lock.json` Änderungen wurden gemacht?
3. `npm run build` lokal ausführen um sicherzustellen dass nichts bricht
4. PR mergen

**Warum kein direkter Commit auf `main`?**
Sicherheitsupdates können theoretisch Breaking Changes enthalten. Der PR gibt dir eine Kontrollinstanz — du entscheidest wann und ob die Fixes gemergt werden.

---

## Zusammenfassung

| Modus | Trigger | Ändert Code? | Erstellt PR? | Bericht? |
|-------|---------|-------------|-------------|---------|
| **Auto** | Push / PR | Nein | Nein | Ja (Artifact) |
| **Scan** | Manuell | Nein | Nein | Ja (Artifact) |
| **Fix** | Manuell | Ja (via PR) | Ja | Ja (Artifact) |

---

## Was `secrets: inherit` im Caller-Workflow bedeutet

```yaml
jobs:
  security:
    uses: P4YM3NT/nextjs-security-pipeline/...@v1
    secrets: inherit
```

`secrets: inherit` gibt dem Reusable Workflow Zugriff auf alle Secrets des aufrufenden Repos — insbesondere `GITHUB_TOKEN`. Dieses Token ist automatisch in jedem GitHub-Repo vorhanden und muss nicht manuell angelegt werden. Es erlaubt dem Fix-Modus, Branches zu erstellen und PRs zu öffnen. Du konfigurierst keine eigenen Secrets.

---

## Jobs laufen parallel

Die 5 Scan-Jobs laufen **gleichzeitig**, nicht nacheinander:

```
t=0                                        t=5min
│                                               │
├── gitleaks        ████                        │
├── npm-audit       ████                        │
├── eslint-security ██████                      │
├── semgrep         ████████████  ← längster    │
└── knip            █████                       │
                                 │
                                 ▼
                       report    ████
                                      │
                                      ▼ Fertig
```

Gesamtdauer ~5 Min — statt ~10 Min sequenziell.
