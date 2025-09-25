module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore', 
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
  ignores: [
    // Ignore merge commits
    (message) => message.startsWith('Merge'),
    // Ignore GitHub co-authored commits and similar
    (message) => message.includes('Co-authored-by:'),
    // Ignore commits that are just file updates without conventional format
    (message) => /^(Update|Add|Remove|Delete)\s+[\w\/.-]+\s*$/.test(message),
  ],
};