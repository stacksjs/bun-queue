import type { PickierOptions } from 'pickier'

const config: PickierOptions = {
  verbose: false,
  pluginRules: {
    // TypeScript rules
    'ts/no-explicit-any': 'off',
    'ts/no-unused-vars': 'warn',
    'ts/no-top-level-await': 'off',

    // Disable rules with false positives
    'regexp/no-unused-capturing-group': 'off',
    'regexp/no-super-linear-backtracking': 'off',
    'style/brace-style': 'off',
    'style/max-statements-per-line': 'off',

    // Markdown rules
    'markdown/heading-increment': 'error',
    'markdown/no-trailing-spaces': 'error',
    'markdown/fenced-code-language': 'warn',
    'markdown/no-inline-html': 'off',
    'markdown/reference-links-images': 'off',
    'markdown/single-title': 'off',
    'markdown/blanks-around-fences': 'off',
    'markdown/no-duplicate-heading': 'off',
    'markdown/single-trailing-newline': 'off',
    'markdown/link-image-style': 'off',
  },
}

export default config
