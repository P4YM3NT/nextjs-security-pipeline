# Der HTML-Sicherheitsbericht — Lesen & Interpretieren

Der Report ist das Endprodukt der Pipeline und hat zwei Zielgruppen: **du** (technische Einschätzung) und **dein Kunde** (DSGVO-Nachweis, Vertrauen).

---

## Wo ist der Report?

Nach jedem Scan-Lauf:

1. GitHub → Kundenprojekt-Repo → Tab **"Actions"**
2. Letzten "Security Pipeline" Run anklicken
3. Ganz unten: Abschnitt **"Artifacts"**
4. `security-report-XXXXX` herunterladen (ZIP → enthält `security-report.html`)
5. HTML-Datei lokal im Browser öffnen

Artifacts werden **90 Tage** aufbewahrt, dann automatisch gelöscht.

---

## Aufbau des Reports

### 1. Header

Zeigt Projektname, Datum, Run-ID und Modus (Scan oder Scan + Fix). Der Projektname kommt aus dem `project_name`-Input beim manuellen Auslösen — deshalb dort immer den echten Kundennamen eintragen, nicht den Repo-Namen.

### 2. Status-Banner

Der farbige Balken ganz oben ist die Gesamtbewertung:

| Farbe | Bedeutung | Was tun? |
|-------|-----------|----------|
| Rot | Kritische Probleme (Secrets gefunden ODER kritische CVEs) | Sofort handeln, nicht deployen |
| Orange | Hohe Schwere (High-CVEs oder schwere SAST-Findings) | Diese Woche beheben |
| Gelb | Mittlere Probleme (ESLint-Issues, Medium-CVEs) | In nächstem Sprint beheben |
| Grün | Alles OK | Nichts zu tun |

### 3. Summary-Karten

Fünf Kacheln mit der Anzahl der Findings pro Kategorie auf einen Blick. Die Farbe einer Kachel spiegelt den Schweregrad — grün bedeutet null Findings.

### 4. Secrets & Leaks (Gitleaks)

**Wenn hier etwas steht: sofort handeln.** Jeder Eintrag enthält:

- `Beschreibung` — welche Art von Secret (z.B. "GitHub Personal Access Token")
- `Datei` — in welcher Datei es gefunden wurde
- `Zeile` — genaue Zeilennummer
- `Commit` — in welchem Commit es hinzugefügt wurde
- `Autor` — wer den Commit gemacht hat

**Was danach zu tun ist:**
1. Das Secret beim jeweiligen Dienst sofort **widerrufen** (GitHub, Stripe, AWS etc.)
2. Ein neues Secret generieren und in die `.env` schreiben
3. Die Git-History bereinigen mit `git filter-repo --path <datei> --invert-paths`
4. Alle Team-Mitglieder müssen den Repo neu klonen

### 5. npm Dependency Vulnerabilities

Zeigt alle CVEs in npm-Paketen. Wichtige Spalten:

- `Schweregrad` — Critical/High zuerst beheben
- `Paket` — welches npm-Paket betroffen ist
- `Via` — durch welche direkte Abhängigkeit das Paket ins Projekt kommt
- `Auto-Fix verfügbar` — wenn "Ja": Fix-Modus der Pipeline reicht aus

**Wichtig:** Nicht alle CVEs sind gleich gefährlich. Ein "Critical" in einem `devDependency` das nur beim Build läuft ist weniger kritisch als ein "High" in einer Middleware die HTTP-Requests verarbeitet. Kontext zählt.

### 6. SAST Findings (Semgrep)

Code-Sicherheitsprobleme mit OWASP-Kategorie und Fundstelle. Jeder Eintrag hat:

- `Datei` + `Zeile` — wo genau im Code
- `OWASP` — welche Angriffskategorie (z.B. "A03:2021 Injection")
- `Beschreibung` — Klartext-Erklärung was das Problem ist

Die meisten Semgrep-Findings erfordern manuelle Beurteilung. Nicht jedes Finding ist automatisch ein Sicherheitsproblem — manchmal sind es False Positives. Beurteilung im Kontext des Projekts ist wichtig.

### 7. ESLint Security Issues

Klarer als Semgrep — wenn ESLint eine Security-Regel als Error markiert, ist es fast immer ein echtes Problem. Spalte `Auto-Fix` zeigt ob `eslint --fix` es beheben kann.

### 8. Toter Code (Knip)

Weniger dringend als die anderen Kategorien. Hilft die Codebase sauber zu halten und die Angriffsfläche zu reduzieren. Ungenutzte npm-Pakete mit CVEs sind besonders relevant — sie erscheinen sowohl hier als auch in der npm-Audit-Sektion.

### 9. DSGVO §32-Attestierung

Der grüne Block am Ende des Reports. Dieser Text bescheinigt, dass am angegebenen Datum eine automatisierte Sicherheitsprüfung gemäß Art. 32 DSGVO stattgefunden hat. Du kannst diesen Block direkt in Kundendokumentationen, TOMs oder Auftragsverarbeitungsverträge übernehmen.

---

## Report an Kunden weitergeben

**Was Kunden meistens interessiert:**
- Der farbige Status-Banner (grün = gut, rot = Problem)
- Wie viele kritische Findings es gibt
- Dass du aktiv Sicherheitsmaßnahmen triffst (der DSGVO-Block)

**Was Kunden normalerweise nicht brauchen:**
- Die Details der Semgrep- oder ESLint-Findings (zu technisch)
- Die genauen CVE-IDs

**Empfehlung:** Schick den kompletten Report per E-Mail oder Kundenportal. Die meisten Kunden scrollen zum grünen DSGVO-Block und sind zufrieden. Bei roten Findings kurz erklären was du dagegen tust.

---

## GitHub Actions Summary (ohne Download)

Ohne den Report herunterzuladen gibt es auch eine Kurzübersicht direkt in GitHub:

1. GitHub → Actions → letzter Run → Tab **"Summary"**
2. Zeigt die Tabelle: Kategorie, Anzahl Findings, Status-Emoji

Das ist praktisch für den eigenen schnellen Überblick. Für Kunden nimmst du den vollständigen HTML-Report.
