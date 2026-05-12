# Integration — Pipeline in ein neues Projekt einbinden

Dieser Prozess dauert ca. 5 Minuten und muss nur einmal pro Projekt gemacht werden.

**Voraussetzung:** Das Kundenprojekt ist auf GitHub unter der `ptr-digital`-Organisation (oder du hast Zugriff auf das zentrale Pipeline-Repo).

---

## Schritt 1: Workflow-Datei anlegen

Im Kundenprojekt-Repo diese Datei anlegen:

**Pfad:** `.github/workflows/security.yml`

```yaml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
    inputs:
      mode:
        description: "scan = nur prüfen | fix = auto-fix + PR erstellen"
        default: scan
        required: true
        type: choice
        options:
          - scan
          - fix
      project_name:
        description: "Projektname für den Sicherheitsbericht"
        default: "Mein Projekt"

jobs:
  security:
    uses: ptr-digital/nextjs-security-pipeline/.github/workflows/security-scan.yml@v1
    with:
      mode: ${{ inputs.mode || 'scan' }}
      project_name: ${{ inputs.project_name || github.repository }}
    secrets: inherit
```

**`project_name` anpassen** — dieser Name erscheint im Kundenbericht:
```yaml
      project_name: ${{ inputs.project_name || 'Photography Portfolio' }}
```

---

## Schritt 2: Pushen

```bash
git add .github/workflows/security.yml
git commit -m "ci: add ptr-digital security pipeline"
git push
```

GitHub erkennt die neue Workflow-Datei automatisch. Der erste Scan startet sofort beim Push.

---

## Schritt 3: Ersten Scan beobachten

1. GitHub → Kundenprojekt-Repo → Tab **"Actions"**
2. Du siehst den laufenden Workflow "Security Pipeline"
3. Klicke drauf → siehst die 5 parallel laufenden Jobs
4. Nach ~3–5 Minuten: alle Jobs abgeschlossen
5. Oben auf der Seite: **"Summary"** zeigt die Kurzübersicht
6. Unten: **"Artifacts"** → `security-report-XXXXX` herunterladen

---

## Schritt 4 (optional): ESLint Security Config einbinden

Damit die Security-Regeln auch beim lokalen Entwickeln im Editor angezeigt werden, kannst du die geteilte ESLint-Config einbinden.

Im Kundenprojekt `eslint.config.mjs`:

```js
import nextConfig from 'eslint-config-next';
// Relativer Pfad zum Pipeline-Repo (wenn als Subdir vorhanden)
// oder: npm install eslint-plugin-security --save-dev
import security from 'eslint-plugin-security';

export default [
  ...nextConfig,
  security.configs.recommended,
  {
    rules: {
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    }
  }
];
```

```bash
npm install --save-dev eslint-plugin-security
```

---

## Was du NICHT tun musst

- Kein Python installieren (Semgrep läuft im CI-Runner)
- Kein Gitleaks-Binary installieren (läuft per GitHub Action)
- Keine npm-Packages aus dem Pipeline-Repo installieren
- Keine Secrets oder API-Keys konfigurieren (der Workflow nutzt `secrets: inherit` — GitHub Token ist automatisch verfügbar)

---

## Häufige Fragen bei der Integration

**Fehler: "Workflow konnte nicht gefunden werden"**

Das passiert wenn das zentrale Repo noch nicht auf GitHub gepusht ist oder der Tag `v1` fehlt. Lösung:
```bash
# Im nextjs-security-pipeline Repo:
git push origin main
git push origin v1
```

**Fehler: "Resource not accessible by integration"**

Das zentrale Repo muss für das Kundenprojekt zugänglich sein. Beide müssen in derselben GitHub-Organisation (`ptr-digital`) sein. Oder: das zentrale Repo auf **public** stellen (der Code ist nicht sensitiv, nur Workflow-Definitionen).

**Der Scan dauert sehr lange**

Semgrep (SAST) ist der langsamste Job bei großen Codebases (~2–5 Min). Das ist normal. Alle anderen Jobs laufen parallel dazu.

**Kann ich bestimmte Dateien/Ordner ausschließen?**

Ja — eine `.semgrepignore` oder `.gitleaksignore` Datei im Kundenprojekt anlegen:

```
# .gitleaksignore
# Seed-Scripts mit Test-Daten ausschließen
src/payload/seed.ts
scripts/

# .semgrepignore
node_modules/
.next/
```

---

## Checkliste für neue Projekte

```
[ ] .github/workflows/security.yml angelegt
[ ] project_name angepasst (z.B. "Restaurant Weber - Website")
[ ] Auf GitHub gepusht
[ ] Ersten Scan in GitHub Actions beobachtet
[ ] HTML-Report heruntergeladen und überprüft
[ ] (Optional) eslint-plugin-security in package.json eingetragen
```
