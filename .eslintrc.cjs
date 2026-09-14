// ESLint config — flat só se usa via ESLint 9. Aqui é legacy .eslintrc.cjs
// porque ainda estamos em ESLint 8.x para compat com a stack atual.

module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  settings: { react: { version: '18.2' } },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/prop-types': 'off',         // PropTypes já são validados pelo próprio runtime
    'react/react-in-jsx-scope': 'off', // React 18 + Vite não precisa do import React em cada arquivo
    'react/no-unknown-property': ['error', { ignore: ['css'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-console': 'off',
    'no-undef': 'off', // jsx/globals do Vitest não estão todos aqui
    // Regex APT/Flatpak têm `\-` propositais (caracteres escaped intencionalmente).
    // Silencia warnings desses arquivos específicos.
    'no-useless-escape': 'off'
  },
  overrides: [
    {
      files: ['scripts/**/*.{js,cjs}', 'vite.config.js', 'vitest.config.js', 'tailwind.config.js', 'postcss.config.js'],
      env: { node: true, browser: false },
      parserOptions: { sourceType: 'module' }
    },
    {
      files: ['src/test/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
      env: { node: true },
      rules: { 'no-console': 'off' }
    }
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', 'public/data/']
};