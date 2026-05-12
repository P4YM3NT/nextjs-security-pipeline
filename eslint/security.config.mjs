/**
 * ptr-digital Shared ESLint Security Config
 * Einbinden in Kundenprojekte:
 *
 *   import securityConfig from '../nextjs-security-pipeline/eslint/security.config.mjs';
 *   export default [...securityConfig, ...projektspezifischeRegeln];
 */

import security from 'eslint-plugin-security';

export default [
  security.configs.recommended,
  {
    rules: {
      // Kritische Sicherheitsregeln (error)
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-new-buffer': 'error',

      // Warnungen (warn)
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-object-injection': 'warn',

      // Allgemeine Sicherheitsregeln
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
