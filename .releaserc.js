module.exports = {
  branches: ['main'],
  plugins: [
    // Analyze commits to determine the type of release
    '@semantic-release/commit-analyzer',
    
    // Generate release notes
    '@semantic-release/release-notes-generator',
    
    // Update CHANGELOG.md
    '@semantic-release/changelog',
    
    // Update package.json version
    '@semantic-release/npm',
    
    // Create git tag and push changes
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    
    // Create GitHub release with extension builds
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'extension-chrome-v*.zip',
            label: 'Chrome Extension',
          },
          {
            path: 'extension-firefox-v*.zip', 
            label: 'Firefox Extension',
          },
        ],
      },
    ],
  ],
};