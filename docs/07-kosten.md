# Kosten & GitHub Actions Kontingente

---

## Kurzfassung

**Tool-Kosten: €0.** Alle fünf Tools sind MIT- oder Apache-2.0-lizenziert und kostenlos.

**GitHub Actions:** Das Free-Tier reicht für ~5–8 Projekte. Ab ~10+ Projekten lohnt sich GitHub Pro oder Team.

---

## Tool-Kosten im Detail

| Tool | Lizenz | Kosten | Einschränkungen im Free-Tier |
|------|--------|--------|------------------------------|
| Gitleaks | MIT | €0 | Keine |
| Semgrep CLI | MIT (OSS) | €0 | Keine (mit `--metrics=off`) |
| npm audit | Built-in npm | €0 | Keine |
| eslint-plugin-security | MIT | €0 | Keine |
| Knip | MIT | €0 | Keine |
| peter-evans/create-pull-request | MIT | €0 | Keine |

Kein Abonnement, keine Kreditkarte, keine Registrierung bei externen Diensten nötig.

---

## GitHub Actions Kontingente

GitHub Actions verrechnet **Minuten** pro Monat für private Repositories.

| GitHub Plan | Minuten/Monat (privat) | Preis |
|-------------|----------------------|-------|
| Free | 2.000 Min | €0 |
| Pro (1 User) | 3.000 Min | ~$4/Monat |
| Team | 3.000 Min | ~$4/User/Monat |

**Öffentliche Repositories** verbrauchen keine Minuten — dort läuft GitHub Actions unbegrenzt kostenlos. Wenn Kundenprojekte öffentlich auf GitHub liegen, ist das Kontingent kein Thema.

---

## Wie viele Minuten verbraucht ein Scan?

Ein vollständiger Pipeline-Lauf dauert ca. **5 Minuten** (parallel), was ca. **25 Minuten** verbrauchter GitHub Actions Zeit entspricht (5 Jobs × 5 Min = 25 Min, weil jeder Job auf einem eigenen Runner läuft).

| Trigger | Häufigkeit (Beispiel) | Verbrauch/Monat |
|---------|----------------------|-----------------|
| Push auf `main` | 20×/Monat | 20 × 25 = 500 Min |
| PRs | 10×/Monat | 10 × 25 = 250 Min |
| Manueller Scan | 1×/Monat | 25 Min |
| **Gesamt** | | **~775 Min/Monat** |

Das sind die Zahlen für **ein** aktives Projekt.

---

## Kapazitätsplanung nach Projektzahl

| Projekte | Aktivität/Projekt | Verbrauch gesamt | Empfohlener Plan |
|----------|-------------------|-----------------|-----------------|
| 1–2 | normal | ~1.500 Min | Free |
| 3–5 | normal | ~2.500–4.000 Min | Free reicht, eng |
| 6–10 | normal | ~4.500–8.000 Min | Pro oder Team |
| 10+ | normal | 8.000+ Min | Team + ggf. Extra-Minuten |

**Extra-Minuten** kosten bei GitHub $0.008/Min (Linux). 1.000 zusätzliche Minuten = ~$8.

---

## Optimierungsmöglichkeiten wenn das Kontingent knapp wird

**1. Semgrep nur wöchentlich statt bei jedem Push**

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * 1'  # Montags um 3 Uhr
  workflow_dispatch:
```

Semgrep ist der langsamste Job (~4 Min). Ihn nur wöchentlich zu starten spart ~80% der Zeit.

**2. Path-Filter: nur scannen wenn relevante Dateien geändert wurden**

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'package.json'
      - 'package-lock.json'
```

Push von nur einer `README.md` löst dann keinen Scan aus.

**3. Weniger Jobs parallelisieren**

Jobs sequenziell statt parallel schalten verbraucht weniger Minuten (weil weniger Runner gleichzeitig laufen) — dauert aber länger. Sinnvoll wenn Kontingent knapper als Zeit ist.

---

## GitHub Free vs. Pro: Was ändert sich?

Für die Pipeline selbst ändert sich nichts außer dem Minuten-Kontingent. Alle Features (Reusable Workflows, Artifacts, Secrets, `workflow_dispatch`) sind in allen GitHub-Plänen verfügbar.

---

## Kostenvergleich mit Alternativen

| Alternative | Kosten | Warum nicht gewählt |
|-------------|--------|---------------------|
| Snyk Team | ~$75/Monat (3 Seats minimum) | EU-Datenresidenz nur Enterprise; teuer |
| Snyk Enterprise | Auf Anfrage (~$200+/Monat) | Overkill für Agentur-Größe |
| SonarCloud | $0 (public) / ab $10/Monat | Schickt Code an externe Server |
| GitHub Advanced Security | $49/User/Monat | CodeQL inklusive, aber sehr teuer |
| Diese Pipeline | €0 Tools + GitHub-Plan | Alle Anforderungen erfüllt |

---

## Empfehlung

**Bis 5 Projekte:** GitHub Free reicht. Kontingent im Auge behalten unter Settings → Billing.

**Ab 6–10 Projekte:** GitHub Pro (~$4/Monat) für mehr Sicherheit beim Kontingent.

**Ab 10+ Projekte:** GitHub Team + evtl. Semgrep auf wöchentlichen Schedule verschieben.
