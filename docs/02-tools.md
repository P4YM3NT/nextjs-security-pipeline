# Die 5 Tools — Was sie prüfen und warum

Jedes Tool in der Pipeline hat eine klar abgegrenzte Aufgabe. Sie überlappen sich bewusst kaum — zusammen decken sie den gesamten relevanten Angriffsfläche einer Next.js-Webanwendung ab.

---

## 1. Gitleaks — Secret Scanning

**Was ist das?**
Gitleaks durchsucht den gesamten Git-Verlauf (nicht nur den aktuellen Stand) nach Secrets: API-Keys, Passwörter, Tokens, Private Keys.

**Warum ist das kritisch?**
Secrets im Code sind das häufigste und folgenreichste Sicherheitsproblem bei Web-Projekten. Das Problem: `git rm` entfernt eine Datei aus dem aktuellen Stand, aber nicht aus der History. Wer die History klont, findet das Secret trotzdem. Gitleaks prüft beides.

**Was genau sucht es?**
Über 150 eingebaute Muster für bekannte Dienste:
- AWS Access Keys (`AKIA...`)
- GitHub Tokens (`ghp_...`, `ghs_...`)
- Stripe API Keys (`sk_live_...`)
- Payload-Secrets, JWT-Secrets
- Private RSA/EC Keys (`-----BEGIN RSA PRIVATE KEY-----`)
- SendGrid, Mailgun, Twilio, Slack, Discord Tokens
- Generische High-Entropy-Strings (wahrscheinliche Secrets ohne bekanntes Muster)

**Was passiert wenn etwas gefunden wird?**
Der Job schlägt fehl (Exit Code 1). Der Report zeigt: Datei, Zeile, Commit, Autor. Der Fix muss manuell erfolgen (Secret widerrufen, aus History bereinigen mit `git filter-repo`).

**Auto-Fix möglich?** Nein — ein gefundenes Secret muss beim Anbieter widerrufen werden. Code-Bereinigung allein reicht nicht.

**Lizenz:** MIT. Läuft vollständig lokal, keine Daten verlassen die GitHub-Infrastruktur.

---

## 2. npm audit — Dependency Vulnerability Scanning

**Was ist das?**
`npm audit` ist in npm eingebaut und prüft alle Abhängigkeiten (direkte + transitive) gegen die GitHub Advisory Database (GHSA) — eine der umfangreichsten CVE-Datenbanken für npm-Pakete.

**Warum ist das relevant?**
Moderne Next.js-Projekte haben typischerweise 300–800 transitive Abhängigkeiten. Jede davon kann CVEs bekommen — oft ohne dass man es bemerkt. Bekannte Beispiele:
- `lodash` < 4.17.21 → Prototype Pollution (CVSS 9.8)
- `node-fetch` < 2.6.7 → SSRF Vulnerability
- `sharp` (wird in photography-v2 genutzt) → hat in der Vergangenheit kritische Lücken gehabt

**Was genau wird geprüft?**
- Alle `dependencies` und `devDependencies`
- Transitive Abhängigkeiten (Abhängigkeiten von Abhängigkeiten)
- Schweregrade: Critical, High, Moderate, Low
- Ob ein Fix verfügbar ist (und welche Version)

**Auto-Fix möglich?** Ja:
- `npm audit fix` — patcht alle Lücken ohne Breaking Changes (Minor/Patch-Updates)
- `npm audit fix --force` — patcht auch mit Breaking Changes (Major-Updates, Vorsicht!)

Im Fix-Modus der Pipeline wird nur `npm audit fix` ausgeführt (kein `--force`), um den Code nicht zu brechen.

**Was wird an npm gesendet?**
Nur der Hash der `package-lock.json` — kein Quellcode, keine persönlichen Daten. npm hat ein DSGVO-DPA.

---

## 3. Semgrep — SAST (Static Application Security Testing)

**Was ist das?**
Semgrep analysiert den Quellcode auf bekannte Schwachstellen-Muster — ohne den Code auszuführen. Es arbeitet mit regelbasierten Patterns (YAML-Regeln) die von Sicherheitsexperten gepflegt werden.

**Was unterscheidet Semgrep von ESLint?**
ESLint prüft Stil und allgemeine Code-Qualität (mit Security-Plugins als Erweiterung). Semgrep ist von Grund auf für Sicherheitsanalyse gebaut: Es versteht Datenfluss, erkennt Security-relevante Patterns kontextbezogen und hat spezialisierte Regelsets.

**Welche Regelsets werden genutzt?**

`p/owasp-top-ten` — prüft auf alle OWASP Top 10 Kategorien:
| OWASP | Was Semgrep prüft |
|-------|-------------------|
| A01 Broken Access Control | Fehlende Auth-Prüfungen in API-Routen |
| A02 Cryptographic Failures | Schwache Hashing-Algorithmen (MD5, SHA1) |
| A03 Injection | SQL Injection, Command Injection, Path Traversal |
| A05 Security Misconfiguration | Unsichere Default-Konfigurationen |
| A07 Auth Failures | Unsichere Session-Handling-Patterns |
| A09 Logging Failures | Sensible Daten in Logs |

`p/nextjs` — Next.js-spezifische Regeln:
- CVE-2025-29927 (Middleware Auth Bypass via `x-middleware-subrequest`)
- Unsichere `dangerouslySetInnerHTML`-Nutzung (XSS)
- Fehlende Input-Validierung in Server Actions
- Unsichere `redirect()`-Aufrufe
- Lokalstorage für Auth-Tokens (XSS-anfällig)

`p/typescript` — TypeScript-spezifische Security-Patterns.

**Auto-Fix möglich?** Teilweise — für manche Regeln gibt es automatische Korrekturen. Die meisten Findings erfordern manuelle Überprüfung.

**Datenschutz:** Der CLI-Aufruf wird mit `--metrics=off` ausgeführt. Es werden keinerlei Code-Daten an Semgrep-Server gesendet. Vollständig lokal.

---

## 4. ESLint + eslint-plugin-security — Sicherheits-Linting

**Was ist das?**
ESLint ist bereits in Next.js-Projekten enthalten. Die Pipeline ergänzt es um `eslint-plugin-security` — ein Plugin das unsichere JavaScript/Node.js-Patterns als Fehler markiert.

**Was prüft das Plugin konkret?**

| Regel | Was sie verhindert | Schweregrad |
|-------|-------------------|-------------|
| `detect-eval-with-expression` | `eval()` mit dynamischen Strings → Code Injection | Error |
| `detect-unsafe-regex` | ReDoS-Attacken durch katastrophales Backtracking | Error |
| `detect-buffer-noassert` | Node.js Buffer-Overflows | Error |
| `detect-child-process` | Unsichere `child_process.exec()` Aufrufe | Error |
| `detect-disable-mustache-escape` | Template-Injection | Error |
| `detect-non-literal-regexp` | Dynamische RegExp mit User-Input → ReDoS | Warn |
| `detect-possible-timing-attacks` | Timing-Attacken bei String-Vergleichen (Auth) | Warn |
| `detect-object-injection` | Prototype Pollution via Bracket-Notation | Warn |
| `no-eval` | JavaScript-Kern: eval() ist generell gefährlich | Error |
| `no-implied-eval` | setTimeout/setInterval mit String-Argument | Error |
| `no-new-func` | `new Function(string)` → Code Injection | Error |

**Warum ESLint zusätzlich zu Semgrep?**
Semgrep und ESLint fangen unterschiedliche Dinge. ESLint ist IDE-integriert (Feedback beim Schreiben), Semgrep ist tiefergehend beim CI-Scan. Außerdem: `eslint --fix` kann viele Probleme automatisch beheben.

**Auto-Fix möglich?** Ja — `eslint --fix` behebt alle automatisch behebbaren Issues. Komplexere (z.B. unsichere Regex) erfordern manuelles Eingreifen.

---

## 5. Knip — Dead Code Detection

**Was ist das?**
Knip findet ungenutzten Code: Dateien die nirgends importiert werden, exportierte Funktionen die niemand aufruft, npm-Pakete die installiert aber nie benutzt werden.

**Was hat das mit Sicherheit zu tun?**
Auf den ersten Blick nichts — aber:

1. **Ungenutzte Abhängigkeiten** sind trotzdem in `node_modules` und können CVEs haben. Jedes entfernte Paket verkleinert die Angriffsfläche.

2. **Ungenutzter Code** (insbesondere API-Routen, Middleware, Auth-Logik) ist nicht getestet, nicht gewartet und kann unbemerkt Sicherheitslücken enthalten.

3. **Veraltete Seed-Routen oder Debug-Endpunkte** tauchen als ungenutzter Code auf — ein Hinweis dass sie entfernt werden sollten.

**Was genau findet Knip?**
- Nicht importierte Dateien
- Nicht aufgerufene exportierte Funktionen/Klassen/Types
- npm-Pakete in `package.json` die nie `import`-ed werden
- Ungenutzte `devDependencies`

**Auto-Fix möglich?** Ja — `knip --fix` entfernt ungenutzte Exports und kann `package.json` bereinigen. Dateien werden **nicht** automatisch gelöscht (manuelle Entscheidung).

---

## Tool-Übersicht

| Tool | Kategorie | Findet | Auto-Fix | Lokal | Kosten |
|------|-----------|--------|----------|-------|--------|
| Gitleaks | Secret Scanning | API-Keys, Tokens im Code/History | ❌ | ✅ | Kostenlos |
| npm audit | Dependency Scan | CVEs in npm-Paketen | ✅ | ✅ | Kostenlos |
| Semgrep | SAST | XSS, Injection, Next.js CVEs | ⚠️ | ✅ | Kostenlos |
| ESLint Security | Code-Analyse | Unsichere JS-Patterns | ✅ | ✅ | Kostenlos |
| Knip | Dead Code | Ungenutzte Dateien/Pakete | ✅ | ✅ | Kostenlos |
