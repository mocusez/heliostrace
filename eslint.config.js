import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default tseslint.config(
    { ignores: ['build/**', 'crate/**', 'node_modules/**', '*.config.js'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    react.configs.flat.recommended,
    {
        files: ['src/**/*.{ts,tsx}', 'types/**/*.d.ts'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'none' }],
            '@typescript-eslint/no-namespace': 'error',
            'react/react-in-jsx-scope': 'off',
            'no-alert': 'error',
            'prefer-const': 'error',
            // Long-standing violations in legacy code (vega spec regexes,
            // worker switch blocks); demoted so lint gates new code only.
            'no-useless-escape': 'warn',
            'no-case-declarations': 'warn',
            'no-prototype-builtins': 'warn',
            'no-useless-assignment': 'warn',
            '@typescript-eslint/no-wrapper-object-types': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/no-unused-expressions': 'warn',
            'no-return-assign': 'error',
            'no-useless-call': 'error',
            'no-useless-concat': 'error',
        },
    },
    {
        files: ['src/worker.ts', 'src/worker_bindings.ts'],
        languageOptions: {
            globals: globals.worker,
        },
    }
);
