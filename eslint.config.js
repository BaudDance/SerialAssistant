import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: ['src/components/ui/**'],
    vue: true,
    formatters: true,
  },
  {

    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'eqeqeq': 'warn',
      'vue/eqeqeq': 'warn',
      'vue/no-useless-v-bind': 'warn',
      'unused-imports/no-unused-vars': 'warn',
      'vue/require-v-for-key': 'warn',
      'no-restricted-globals': 'off',
      'no-async-promise-executor': 'off',
      'no-unmodified-loop-condition': 'warn',
    },
  },
)
