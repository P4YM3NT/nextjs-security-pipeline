# DSGVO, Recht & Compliance

Diese Seite erklärt warum die Pipeline DSGVO-konform ist, welche rechtliche Relevanz sie hat und was du Kunden gegenüber sagen kannst.

---

## Kurzfassung

Die Pipeline schickt keinen Quellcode an Drittanbieter-Dienste. Alle Analyse-Tools laufen entweder vollständig lokal auf dem GitHub Actions Runner oder senden nur anonyme Metadaten (npm audit). GitHub selbst hat eine DSGVO-konforme Datenverarbeitungsvereinbarung (DPA) mit Standardvertragsklauseln (SCCs) für den EU-Datenschutz.

---

## Warum überhaupt DSGVO-relevant?

Als Web-Agentur verarbeitest du Quellcode, der möglicherweise:
- Datenbankverbindungen zu personenbezogenen Daten enthält
- Konfigurationen von Systemen die personenbezogene Daten verarbeiten
- (In seltenen Fällen) direkt personenbezogene Daten im Code enthält

Wenn du Code-Analyse-Tools nutzt, die diesen Code an externe Server schicken, ist das eine Datenübertragung die du rechtfertigen musst. Die Pipeline vermeidet das bewusst.

---

## Datenschutzbewertung der einzelnen Tools

### Gitleaks — vollständig lokal
Gitleaks ist eine Open-Source-Binary (MIT-Lizenz) die auf dem GitHub Actions Runner läuft. Sie schickt keine Daten nach außen. Der Code verlässt die GitHub-Infrastruktur nicht.

### Semgrep CLI — lokal mit explizit deaktivierter Telemetrie
Semgrep wird mit `--metrics=off` ausgeführt. Dieser Flag deaktiviert jegliche Telemetrie. Im Standard-Modus würde Semgrep anonyme Scan-Metriken an Semgrep.dev schicken — mit `--metrics=off` nicht. Der Code verlässt die GitHub-Infrastruktur nicht.

Dokumentation von Semgrep dazu: "When `--metrics=off` is set, no data is sent to Semgrep servers."

### npm audit — sendet nur Paket-Metadaten
`npm audit` schickt den Hash der `package-lock.json` an die npm-Registry (registry.npmjs.org) um bekannte CVEs abzufragen. Es wird **kein Quellcode** übertragen, nur die Liste der installierten Pakete und deren Versionen.

npm Inc. (GitHub/Microsoft) hat eine DSGVO-konforme Datenschutzrichtlinie und ein DPA. Das ist vergleichbar mit dem Abrufen von npm-Paketen beim `npm install` — das macht jedes Projekt ohnehin.

### ESLint + eslint-plugin-security — vollständig lokal
ESLint ist ein lokales Tool ohne Netzwerk-Kommunikation. Kein Datentransfer.

### Knip — vollständig lokal
Knip ist ein lokales Tool ohne Netzwerk-Kommunikation. Kein Datentransfer.

### GitHub Actions (die Plattform selbst)
GitHub verarbeitet den Quellcode auf ihren Servern um die Workflows auszuführen. Das ist der einzige externe Datentransfer — aber GitHub ist der Dienst, bei dem der Code ohnehin gespeichert ist (das Kundenprojekt-Repo). Es kommt kein neuer Dienstleister hinzu.

GitHub hat:
- Ein vollständiges DSGVO-DPA: [github.com/site/dpa](https://github.com/site/dpa)
- Standardvertragsklauseln (SCCs) gemäß EU-Datenschutz
- ISO 27001 Zertifizierung
- SOC 2 Type II Zertifizierung

---

## Bewusst ausgelassene Tools (und warum)

### Snyk — nicht genutzt
Snyk ist ein US-amerikanischer Dienst der Code-Scans in der Cloud ausführt. Kostenlose und Team-Tier Accounts nutzen US-Server. EU-Datenresidenz ist erst im Enterprise-Tier verfügbar (~$75+/Monat). Für die Anforderungen dieser Pipeline ist npm audit ausreichend — ohne Daten an einen weiteren US-Dienst zu schicken.

### Socket.dev — nicht genutzt
Socket.dev hat keine klare EU-Datenresidenz. Für eine DSGVO-bewusste Agentur nicht empfehlenswert.

---

## Artikel 32 DSGVO — Sicherheit der Verarbeitung

Art. 32 DSGVO verpflichtet Verantwortliche und Auftragsverarbeiter zu "geeigneten technischen und organisatorischen Maßnahmen" um ein dem Risiko angemessenes Schutzniveau zu gewährleisten. Konkret nennt der Artikel:

> "(d) ein Verfahren zur regelmäßigen Überprüfung, Bewertung und Evaluierung der Wirksamkeit der technischen und organisatorischen Maßnahmen zur Gewährleistung der Sicherheit der Verarbeitung"

**Die Pipeline erfüllt genau das:**
- Regelmäßige Überprüfung (automatisch bei jedem Push + monatlich manuell)
- Bewertung der Maßnahmen (Report mit Schweregrad-Einstufung)
- Evaluierung (Trend über Zeit durch gespeicherte Reports)

Der DSGVO §32-Block im HTML-Report ist kein juristisches Dokument — er ist eine Aufzeichnung dass diese Prüfung stattgefunden hat. Das ist nützlich für:
- Technisch-Organisatorische Maßnahmen (TOMs) Dokumentation
- Auftragsverarbeitungsverträge (AVV) mit Kunden
- Nachweise gegenüber Datenschutzbehörden

---

## Was du in Kundenverträge schreiben kannst

In Auftragsverarbeitungsverträge oder TOMs-Dokumentation:

> "Der Auftragnehmer (ptr-digital) führt automatisierte Sicherheitsprüfungen der entwickelten und betriebenen Webanwendungen durch. Diese umfassen: Scanning auf versehentlich committed Zugangsdaten (Gitleaks), Prüfung bekannter Sicherheitslücken in verwendeten Bibliotheken (npm Security Advisory Database), statische Code-Analyse auf Sicherheitsmuster (Semgrep, OWASP Top 10) sowie sicherheitsorientiertes Linting (ESLint Security Plugin). Die Prüfungen laufen automatisiert bei jeder Code-Änderung sowie auf Anfrage. Berichte werden auf Anfrage des Auftraggebers bereitgestellt. Alle Analyse-Tools verarbeiten den Quellcode ausschließlich innerhalb der GitHub Actions Infrastruktur (Microsoft/GitHub, EU-DSGVO-DPA vorhanden)."

---

## BSI IT-Grundschutz (für größere Kunden)

Falls ein Kunde BSI-Grundschutz oder ISO 27001 Nachweise benötigt, deckt die Pipeline folgende Bausteine ab:

| BSI-Baustein | Relevanz der Pipeline |
|-------------|----------------------|
| APP.3.3 Webanwendungen | Automatisierte Sicherheitstests der Web-App |
| APP.3.4 Webservices | Supply-Chain-Sicherheit (npm-Pakete) |
| CON.8 Software-Entwicklung | Sicherheitsprüfung im Entwicklungsprozess |
| OPS.1.1.6 Software-Tests | Automatisierte Tests vor Produktionsdeployment |

Die Pipeline allein reicht nicht für eine ISO 27001-Zertifizierung — sie ist aber ein dokumentierter Bestandteil eines Sicherheitsprogramms.

---

## Offene Fragen / Grenzen

**Was die Pipeline nicht abdeckt:**
- Laufzeit-Sicherheit (Intrusion Detection, WAF)
- Penetrationstests (die müssen von Menschen durchgeführt werden)
- DSGVO-Compliance des Codes selbst (z.B. ob Consent korrekt eingeholt wird)
- Infrastruktur-Sicherheit (Server, DNS, TLS-Konfiguration)

**Für vollständige DSGVO-Compliance** braucht es zusätzlich: Datenschutz-Folgenabschätzung (DSFA) wenn relevant, Verarbeitungsverzeichnis, Datenschutzbeauftragter wenn nötig.
