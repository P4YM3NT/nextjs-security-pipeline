# Architektur — Wie alles zusammenhängt

---

## Das Kernprinzip: GitHub Reusable Workflows

GitHub Actions hat ein Feature namens **Reusable Workflows**. Das bedeutet: Ein Workflow, der in einem Repo definiert ist, kann von beliebig vielen anderen Repos aufgerufen werden — wie eine Funktion, die man importiert.

```
P4YM3NT/nextjs-security-pipeline    ← Zentral (dieses Repo)
        │
        │  @v1 (versionierter Aufruf)
        │
        ├── photography-v2/.github/workflows/security.yml
        ├── restaurant-website/.github/workflows/security.yml
        ├── arzt-praxis/.github/workflows/security.yml
        └── weitere Projekte...
```

**Warum das clever ist:**

- Du pflegst die Pipeline **einmal** — alle Projekte profitieren automatisch
- Kundenprojekte haben nur eine 15-Zeilen-Datei, keinen komplexen Workflow
- Updates brauchst du nur im zentralen Repo — nicht in jedem Kundenprojekt
- Versionierung mit `@v1` / `@v2` verhindert Breaking Changes: Kundenprojekte bleiben auf `v1` stabil, während du `v2` entwickelst

---

## Verzeichnisstruktur des zentralen Repos

```
nextjs-security-pipeline/
│
├── .github/
│   └── workflows/
│       └── security-scan.yml         ← Der Reusable Workflow (Herzstück)
│
├── docs/                             ← Diese Dokumentation
│   ├── 00-uebersicht.md
│   ├── 01-architektur.md             ← Du bist hier
│   ├── 02-tools.md
│   ├── 03-integration.md
│   ├── 04-modi-workflows.md
│   ├── 05-report.md
│   ├── 06-dsgvo-recht.md
│   └── 07-kosten.md
│
├── eslint/
│   └── security.config.mjs          ← Geteilte ESLint Security-Regeln
│
├── scripts/
│   ├── generate-report.mjs          ← Baut den HTML-Kundenbericht
│   ├── post-summary.mjs             ← Schreibt die GitHub Actions Summary
│   └── local-scan.mjs               ← Für lokalen Scan (ohne GitHub)
│
├── templates/
│   └── report.html                  ← Handlebars-Template für den Bericht
│
└── package.json
```

---

## Datenfluss während eines Scans

```
Kundenprojekt-Repo (z.B. photography-v2)
│
│  Push auf main / PR / manueller Button
│
▼
.github/workflows/security.yml          ← Caller-Workflow (15 Zeilen)
│
│  ruft auf mit: mode=scan, project_name="..."
│
▼
P4YM3NT/nextjs-security-pipeline
.github/workflows/security-scan.yml    ← Reusable Workflow
│
│  Startet 5 parallele Jobs:
│
├── Job: gitleaks         → gitleaks-report.json
├── Job: npm-audit        → npm-audit.json
├── Job: eslint-security  → eslint-results.json
├── Job: semgrep          → semgrep-results.json
└── Job: knip             → knip-results.json
         │
         ▼ (alle abgeschlossen)
         Job: report
         │
         ├── lädt alle JSON-Dateien herunter
         ├── generate-report.mjs → security-report.html
         ├── post-summary.mjs → GitHub Actions Summary
         └── upload artifact "security-report-XXXXX"
```

---

## Wie Versionierung funktioniert

Der Caller-Workflow (im Kundenprojekt) verweist auf einen Git-Tag:

```yaml
uses: P4YM3NT/nextjs-security-pipeline/.github/workflows/security-scan.yml@v1
```

Wenn du eine neue Version mit Breaking Changes veröffentlichst:

```bash
# Im Pipeline-Repo:
git tag -a v2 -m "v2.0.0 - Neue Features"
git push origin v2
```

Kundenprojekte bleiben auf `@v1` stabil — du migrierst sie schrittweise. Kein ungewollter Ausfall bei Kunden.

---

## Warum kein npm-Paket?

| Option | Problem |
|--------|---------|
| npm-Paket (privat) | Supply-Chain-Risiko; braucht Registry-Auth; overkill für CI-Skripte |
| Template kopieren | Kein zentrales Update; 10 Projekte = 10 Kopien die auseinanderlaufen |
| Git Submodule | Komplex, fehleranfällig, schlechte Developer Experience |
| **Reusable Workflow** ✅ | Einfach, versioniert, keine extra Infrastruktur nötig |

---

## Wo Code ausgeführt wird

**Wichtig für DSGVO:** Alles läuft auf GitHub Actions Runnern (Ubuntu-VMs von GitHub/Microsoft). Der Code verlässt die GitHub-Infrastruktur nicht. Keine Drittanbieter-SaaS-Dienste erhalten Quellcode.

Mehr dazu → [06-dsgvo-recht.md](./06-dsgvo-recht.md)
