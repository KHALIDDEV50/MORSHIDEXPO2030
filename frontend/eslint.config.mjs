import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';

/**
 * Feature-Sliced Design layers (docs/architecture.md §2).
 * Imports may only point downward: app → views → widgets → features → entities → shared.
 * Slices of the same layer must not import each other (except within the same slice).
 */
const LAYERS = ['app', 'views', 'widgets', 'features', 'entities', 'shared'];

const lowerLayers = (layer) => LAYERS.slice(LAYERS.indexOf(layer) + 1);

const sliceIsolation = (layer) => ({
  from: { element: { type: layer } },
  disallow: {
    to: {
      element: {
        type: layer,
        captured: { slice: '!{{from.element.captured.slice}}' },
      },
    },
  },
  message: `FSD: slices of the "${layer}" layer must not import each other`,
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.json' } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', partialMatch: false },
        { type: 'views', pattern: 'src/views/*', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['slice'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        2,
        {
          default: 'allow',
          policies: [
            ...LAYERS.map((layer) => ({
              from: { element: { type: layer } },
              disallow: {
                to: {
                  element: {
                    types: {
                      anyOf: LAYERS.filter((l) => l !== layer && !lowerLayers(layer).includes(l)),
                    },
                  },
                },
              },
              message: `FSD: "${layer}" may only import from lower layers (${lowerLayers(layer).join(', ') || 'none'})`,
            })),
            ...['views', 'widgets', 'features', 'entities'].map(sliceIsolation),
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  globalIgnores([
    // The React Native WebView shell has its own toolchain (mobile/package.json)
    'mobile/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
    'fonts/**',
    'public/vendor/**',
    'Read images of design/**',
  ]),
]);
