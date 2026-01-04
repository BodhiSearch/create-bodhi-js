#!/usr/bin/env node

/**
 * Increment the minor version of a semver version string and reset patch to 0
 * Usage: node increment-version.js <version>
 * Example: node increment-version.js 1.2.3 -> 1.3.0
 */

function incrementMinorVersion(version) {
  // Validate version format (x.y.z)
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = version.match(versionRegex);

  if (!match) {
    throw new Error(`Invalid version format: ${version}. Expected format: x.y.z`);
  }

  const [, major, minor] = match;
  const newMinor = parseInt(minor, 10) + 1;

  return `${major}.${newMinor}.0`;
}

function main() {
  const currentVersion = process.argv[2];

  if (!currentVersion) {
    console.error('Usage: node increment-version.js <version>');
    console.error('Example: node increment-version.js 1.2.3');
    process.exit(1);
  }

  try {
    const nextVersion = incrementMinorVersion(currentVersion);
    console.log(nextVersion);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { incrementMinorVersion };
