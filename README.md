# ptr-digital Next.js Security Pipeline

Automatisierte Security-Pipeline für alle ptr-digital Next.js Kundenprojekte.

## Was diese Pipeline prüft

| Tool | Kategorie | Auto-Fix | DSGVO |
|------|-----------|----------|-------|
| **Gitleaks** | Secrets & API-Keys im Code/History | — | ✅ lokal |
| **Semgrep** | SAST: XSS, Injection, Next.js CVEs | teilweise | ✅ lokal |
| **npm audit** | CVEs in npm-Abhängigkeiten | ✅ | ✅ Metadaten |
| **ESLint Security** | Unsichere Code-Patterns | ✅ | ✅ lokal |
| **Knip** | Toter Code & ungenutzte Dependencies | ✅ | ✅ lokal |

## Integration in ein Kundenprojekt (3 Schritte)

### Schritt 1: Workflow-Datei anlegen

Erstelle `.github/workflows/security.yml` im Kundenprojekt:

```yaml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
    inputs:
      mode:
        description: "scan = nur prüfen | fix = auto-fix + PR"
        default: scan
        required: true
        type: choice
        options: [scan, fix]
      project_name:
        description: "Projektname für den Bericht"
        default: "Mein Projekt"

jobs:
  security:
    uses: ptr-digital/nextjs-security-pipeline/.github/workflows/security-scan.yml@v1
    with:
      mode: ${{ inputs.mode || 'scan' }}
      project_name: ${{ inputs.project_name || github.repository }}
    secrets: inherit
```

### Schritt 2: Scan ausführen

GitHub → Actions → "Security Pipeline" → "Run workflow" → `mode: scan`

### Schritt 3: Report herunterladen

GitHub → Actions → letzter Run → Artifacts → `security-report-XXXXX`

## Die 3 Modi

| Modus | Trigger | Was passiert |
|-------|---------|--------------|
| **Auto** | Jeder PR Push | Scan, Ergebnis als GitHub Summary |
| **Scan** | Manuell (Button) | Vollständiger Scan + HTML-Report als Download |
| **Fix** | Manuell (Button) | Scan + alle Auto-Fixes + automatischer PR |

## Lokaler Scan (ohne GitHub Actions)

```bash
# Im Kundenprojekt-Verzeichnis:
node ../nextjs-security-pipeline/scripts/local-scan.mjs         # Nur scannen
node ../nextjs-security-pipeline/scripts/local-scan.mjs --fix   # Scannen + fixen
```

## Versionierung

- `@v1` — stabile Version (alle Kundenprojekte nutzen diese)
- `@main` — neuester Stand (nur für Tests)

Bei Updates: neuen Tag `v2` erstellen, Kundenprojekte auf `@v2` migrieren.

## Dokumentation

Vollständige Doku im [`docs/`](./docs/) Ordner:

| Datei | Inhalt |
|-------|--------|
| [00-uebersicht.md](./docs/00-uebersicht.md) | Einstieg, das große Bild |
| [01-architektur.md](./docs/01-architektur.md) | Reusable Workflows, Repo-Struktur, Datenfluss |
| [02-tools.md](./docs/02-tools.md) | Jedes Tool erklärt: was, warum, was es findet |
| [03-integration.md](./docs/03-integration.md) | Schritt-für-Schritt: neues Projekt einbinden |
| [04-modi-workflows.md](./docs/04-modi-workflows.md) | Auto / Scan / Fix — die 3 Modi im Detail |
| [05-report.md](./docs/05-report.md) | Den HTML-Report lesen, an Kunden weitergeben |
| [06-dsgvo-recht.md](./docs/06-dsgvo-recht.md) | DSGVO §32, Rechtslage, AVV-Formulierungen |
| [07-kosten.md](./docs/07-kosten.md) | GitHub Actions Kontingente, Skalierung |

## DSGVO §32

Alle Tools laufen ausschließlich in der GitHub Actions Infrastruktur.
Kein Code wird an Drittanbieter-Dienste (Snyk, Socket.dev etc.) übertragen.
GitHub hat SCCs (Standard Contractual Clauses) für EU-DSGVO-Konformität.
Reports enthalten eine Art. 32 DSGVO-Attestierung für Kundendokumentation.
