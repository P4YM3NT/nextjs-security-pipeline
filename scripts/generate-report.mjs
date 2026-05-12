#!/usr/bin/env node
/**
 * generate-report.mjs
 * Liest alle JSON-Scan-Ergebnisse und erzeugt einen HTML-Sicherheitsbericht.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Handlebars = require('handlebars');

const PROJECT = process.env.PROJECT || 'Next.js Projekt';
const REPO = process.env.REPO || '';
const RUN_ID = process.env.RUN_ID || '';
const MODE = process.env.MODE || 'scan';
const DATE = new Date().toLocaleDateString('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function safeRead(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function severityLabel(severity) {
  const map = { critical: 'Kritisch', high: 'Hoch', moderate: 'Mittel', low: 'Niedrig', info: 'Info' };
  return map[severity?.toLowerCase()] || severity || 'Unbekannt';
}

function severityColor(severity) {
  const map = { critical: '#dc2626', high: '#ea580c', moderate: '#d97706', low: '#2563eb', info: '#6b7280' };
  return map[severity?.toLowerCase()] || '#6b7280';
}

// ── Daten einlesen ────────────────────────────────────────────────────────────

const npmAudit = safeRead('scan-results/npm-audit.json');
const eslintResults = safeRead('scan-results/eslint-results.json');
const semgrepResults = safeRead('scan-results/semgrep-results.json');
const gitleaksResults = safeRead('scan-results/gitleaks-report.json');
const knipResults = safeRead('scan-results/knip-results.json');

// ── npm audit verarbeiten ─────────────────────────────────────────────────────

const npmVulns = [];
if (npmAudit?.vulnerabilities) {
  for (const [name, vuln] of Object.entries(npmAudit.vulnerabilities)) {
    if (vuln.isDirect || vuln.severity === 'critical' || vuln.severity === 'high') {
      npmVulns.push({
        name,
        severity: severityLabel(vuln.severity),
        severityColor: severityColor(vuln.severity),
        range: vuln.range || '-',
        fixAvailable: vuln.fixAvailable ? 'Ja' : 'Nein',
        via: Array.isArray(vuln.via)
          ? vuln.via.map(v => typeof v === 'string' ? v : v.title || v.url || '').filter(Boolean).join(', ')
          : '-',
      });
    }
  }
}

const npmSummary = npmAudit?.metadata?.vulnerabilities || {};
const npmTotal = Object.values(npmSummary).reduce((a, b) => a + b, 0);

// ── ESLint verarbeiten ────────────────────────────────────────────────────────

const eslintIssues = [];
if (Array.isArray(eslintResults)) {
  for (const file of eslintResults) {
    for (const msg of file.messages || []) {
      if (msg.ruleId?.includes('security') || msg.severity === 2) {
        eslintIssues.push({
          file: file.filePath?.replace(process.cwd(), '') || '',
          line: msg.line || 0,
          rule: msg.ruleId || 'unknown',
          message: msg.message || '',
          severity: msg.severity === 2 ? 'Fehler' : 'Warnung',
          severityColor: msg.severity === 2 ? '#dc2626' : '#d97706',
          fixable: msg.fix ? 'Ja' : 'Nein',
        });
      }
    }
  }
}

// ── Semgrep verarbeiten ───────────────────────────────────────────────────────

const semgrepIssues = (semgrepResults?.results || []).map(r => ({
  file: r.path || '',
  line: r.start?.line || 0,
  rule: r.check_id || '',
  message: r.extra?.message || '',
  severity: severityLabel(r.extra?.severity),
  severityColor: severityColor(r.extra?.severity),
  cwe: r.extra?.metadata?.cwe?.join(', ') || '-',
  owasp: r.extra?.metadata?.owasp?.join(', ') || '-',
}));

// ── Gitleaks verarbeiten ──────────────────────────────────────────────────────

const secrets = Array.isArray(gitleaksResults) ? gitleaksResults.map(s => ({
  description: s.Description || s.RuleID || 'Unbekanntes Secret',
  file: s.File || '',
  line: s.StartLine || 0,
  commit: s.Commit?.slice(0, 8) || '-',
  author: s.Author || '-',
})) : [];

// ── Knip verarbeiten ──────────────────────────────────────────────────────────

const unusedFiles = knipResults?.files || [];
const unusedExports = [];
if (knipResults?.exports) {
  for (const [file, exports] of Object.entries(knipResults.exports)) {
    for (const exp of exports) {
      unusedExports.push({ file, name: exp.name || exp });
    }
  }
}
const unusedDeps = knipResults?.dependencies?.map(d => ({ name: d })) || [];

// ── Gesamtbewertung ───────────────────────────────────────────────────────────

const criticalCount = npmVulns.filter(v => v.severity === 'Kritisch').length +
  secrets.length +
  semgrepIssues.filter(i => i.severity === 'Kritisch').length;

const highCount = npmVulns.filter(v => v.severity === 'Hoch').length +
  semgrepIssues.filter(i => i.severity === 'Hoch').length;

let overallStatus, overallColor, overallEmoji;
if (criticalCount > 0 || secrets.length > 0) {
  overallStatus = 'Kritisch — sofortiger Handlungsbedarf';
  overallColor = '#dc2626';
  overallEmoji = '🔴';
} else if (highCount > 0) {
  overallStatus = 'Hoch — baldige Maßnahmen empfohlen';
  overallColor = '#ea580c';
  overallEmoji = '🟠';
} else if (eslintIssues.length > 0 || semgrepIssues.length > 0) {
  overallStatus = 'Mittel — Verbesserungen empfohlen';
  overallColor = '#d97706';
  overallEmoji = '🟡';
} else {
  overallStatus = 'Gut — keine kritischen Probleme gefunden';
  overallColor = '#16a34a';
  overallEmoji = '🟢';
}

// ── Template laden & rendern ──────────────────────────────────────────────────

const templateSrc = readFileSync(
  new URL('../templates/report.html', import.meta.url),
  'utf-8'
);

Handlebars.registerHelper('ifLength', (arr, options) =>
  (arr?.length > 0) ? options.fn(this) : options.inverse(this)
);

const template = Handlebars.compile(templateSrc);

const html = template({
  project: PROJECT,
  date: DATE,
  repo: REPO,
  runId: RUN_ID,
  mode: MODE === 'fix' ? 'Scan + Auto-Fix' : 'Nur Scan',
  overallStatus,
  overallColor,
  overallEmoji,

  // Secrets
  secrets,
  secretCount: secrets.length,

  // npm
  npmVulns,
  npmTotal,
  npmCritical: npmSummary.critical || 0,
  npmHigh: npmSummary.high || 0,
  npmModerate: npmSummary.moderate || 0,
  npmLow: npmSummary.low || 0,

  // ESLint
  eslintIssues,
  eslintCount: eslintIssues.length,

  // Semgrep
  semgrepIssues,
  semgrepCount: semgrepIssues.length,

  // Knip
  unusedFiles,
  unusedExports,
  unusedDeps,
  unusedFilesCount: unusedFiles.length,
  unusedExportsCount: unusedExports.length,
  unusedDepsCount: unusedDeps.length,
});

writeFileSync('security-report.html', html, 'utf-8');
console.log(`✅ Security Report generiert: security-report.html`);
console.log(`   Secrets: ${secrets.length} | npm: ${npmTotal} | ESLint: ${eslintIssues.length} | Semgrep: ${semgrepIssues.length}`);
