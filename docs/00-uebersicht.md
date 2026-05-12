# Security Pipeline — Übersicht

> **Für wen ist das?**
> Für ptr-digital als Webseiten-Agentur — einmal gebaut, in jedem Kundenprojekt nutzbar.

---

## Was ist das hier?

Eine automatisierte Security-Pipeline für Next.js-Projekte. Sie läuft auf GitHub und prüft jeden Code auf Sicherheitslücken — ohne dass du etwas installieren oder manuell ausführen musst.

**Das zentrale Prinzip:** Einmal aufbauen (`ptr-digital/nextjs-security-pipeline`), überall einbinden. Neue Projekte kriegen die Pipeline in 3 Minuten.

---

## Das Problem, das sie löst

Webseiten-Projekte haben typischerweise drei Sicherheitsprobleme, die unbemerkt entstehen:

1. **Veraltete Pakete** — npm-Abhängigkeiten bekommen regelmäßig CVEs (bekannte Sicherheitslücken). Die meisten Projekte merken das erst, wenn es zu spät ist.

2. **Unsicherer Code** — Bestimmte JavaScript-Patterns (eval, unsichere Regex, falsche Cookie-Einstellungen) öffnen Angriffsflächen. IDE-Plugins helfen, aber sie laufen nicht automatisch bei jedem Commit.

3. **Secrets im Code** — API-Keys, Datenbankpasswörter und Tokens landen versehentlich im Git-Repository. Einmal dort, sind sie schwer vollständig zu entfernen (Git-History).

Diese Pipeline fängt alle drei Problemkategorien automatisch ab — und kann viele davon selbstständig fixen.

---

## Was die Pipeline konkret tut

```
Jeder Code-Push / PR
        │
        ▼
┌──────────────────────────────────────────────────────┐
│                  GitHub Actions                       │
│                                                      │
│  1. 🔑 Gitleaks      → Secrets im Code/History?      │
│  2. 📦 npm audit     → CVEs in Abhängigkeiten?       │
│  3. 🔍 Semgrep       → Unsichere Code-Patterns?      │
│  4. 📝 ESLint        → Security-Regeln verletzt?     │
│  5. 🗑️  Knip         → Toter Code / unused deps?    │
│                                                      │
│  → HTML-Report (Download) + GitHub Summary           │
└──────────────────────────────────────────────────────┘
        │
        ▼
  "Fix"-Knopf → automatischer PR mit allen Fixes
```

---

## Dokumentations-Index

| Datei | Inhalt |
|-------|--------|
| [01-architektur.md](./01-architektur.md) | Wie GitHub Reusable Workflows funktionieren, Repo-Struktur |
| [02-tools.md](./02-tools.md) | Jedes Tool erklärt: was es prüft, warum es wichtig ist |
| [03-integration.md](./03-integration.md) | Schritt-für-Schritt: Pipeline in neues Projekt einbinden |
| [04-modi-workflows.md](./04-modi-workflows.md) | Die 3 Modi (Auto, Scan, Fix) im Detail |
| [05-report.md](./05-report.md) | Den HTML-Report lesen, Ergebnisse interpretieren |
| [06-dsgvo-recht.md](./06-dsgvo-recht.md) | DSGVO §32, Rechtslage, was du Kunden sagen kannst |
| [07-kosten.md](./07-kosten.md) | Kostenübersicht, GitHub-Kontingente, Skalierung |

---

## Schnellstart

```bash
# Neues Projekt einbinden:
# 1. Datei anlegen: .github/workflows/security.yml
# 2. Inhalt: siehe docs/03-integration.md
# 3. Auf GitHub pushen → fertig
```

**Mehr Details:** → [03-integration.md](./03-integration.md)
