#!/usr/bin/env node
/**
 * post-summary.mjs
 * Schreibt eine strukturierte Zusammenfassung in GitHub Actions Job Summary.
 */

import { readFileSync, existsSync, appendFileSync } from 'fs';

const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY;
const PROJECT = process.env.PROJECT || 'Next.js Projekt';

function safeRead(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

const npmAudit = safeRead('scan-results/npm-audit.json');
const eslintResults = safeRead('scan-results/eslint-results.json');
const semgrepResults = safeRead('scan-results/semgrep-results.json');
const gitleaksResults = safeRead('scan-results/gitleaks-report.json');
const knipResults = safeRead('scan-results/knip-results.json');

const npmSummary = npmAudit?.metadata?.vulnerabilities || {};
const npmTotal = Object.values(npmSummary).reduce((a, b) => a + b, 0);

const eslintErrors = Array.isArray(eslintResults)
  ? eslintResults.reduce((sum, f) => sum + (f.errorCount || 0), 0)
  : 0;

const semgrepCount = semgrepResults?.results?.length || 0;
const secretCount = Array.isArray(gitleaksResults) ? gitleaksResults.length : 0;
const unusedCount = (knipResults?.files?.length || 0) + (knipResults?.dependencies?.length || 0);

const critical = (npmSummary.critical || 0) + secretCount;
let emoji = critical > 0 ? '🔴' : npmSummary.high > 0 ? '🟠' : eslintErrors > 0 ? '🟡' : '🟢';

const lines = [
  `# ${emoji} Security Report — ${PROJECT}`,
  '',
  `| Kategorie | Gefunden | Status |`,
  `|-----------|----------|--------|`,
  `| 🔑 Secrets & Leaks (Gitleaks) | ${secretCount} | ${secretCount > 0 ? '🔴 KRITISCH' : '✅ OK'} |`,
  `| 📦 npm Vulnerabilities | ${npmTotal} (${npmSummary.critical || 0} kritisch, ${npmSummary.high || 0} hoch) | ${npmSummary.critical > 0 ? '🔴' : npmSummary.high > 0 ? '🟠' : '✅'} |`,
  `| 🔍 SAST Findings (Semgrep) | ${semgrepCount} | ${semgrepCount > 5 ? '🟠' : semgrepCount > 0 ? '🟡' : '✅'} |`,
  `| 📝 ESLint Security Issues | ${eslintErrors} Fehler | ${eslintErrors > 0 ? '🟡' : '✅'} |`,
  `| 🗑️ Toter Code (Knip) | ${unusedCount} Elemente | ${unusedCount > 10 ? '🟡' : '✅'} |`,
  '',
  `> **Vollständiger Bericht** als Artifact verfügbar: \`security-report-${process.env.RUN_ID || 'latest'}\``,
  '',
  `---`,
  `*ptr-digital Security Pipeline · ${new Date().toLocaleDateString('de-DE')} · DSGVO §32 konform*`,
];

const content = lines.join('\n') + '\n';

if (SUMMARY_FILE) {
  appendFileSync(SUMMARY_FILE, content);
  console.log('✅ GitHub Actions Summary geschrieben');
} else {
  console.log(content);
}
