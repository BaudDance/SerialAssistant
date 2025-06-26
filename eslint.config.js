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
    },
  },
)
