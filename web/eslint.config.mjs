// eslint.config.js
import pluginJs from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVuetify from 'eslint-plugin-vuetify'

export default [
  { files: ['**/*.{js,mjs,cjs,ts,vue}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    }
  },
  {
    plugins: {
      vuetify: pluginVuetify,
    },
    rules: {
      ...pluginVuetify.configs.base.rules,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      'vue/multi-word-component-names': 'off',
      "vue/valid-v-slot": "off",
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true
        }
      ]
    }
  }
];