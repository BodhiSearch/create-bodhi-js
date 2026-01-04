#!/usr/bin/env node

/**
 * Safely delete existing git tag if it exists
 * Usage: node delete-tag-if-exists.js <tag-name>
 * Prompts user for confirmation before deleting
 */

import { execSync } from 'child_process';
import readline from 'readline';

function executeGitCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    // For some git commands, non-zero exit is expected (e.g., tag doesn't exist)
    return null;
  }
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

function tagExists(tagName) {
  const result = executeGitCommand(`git rev-parse "${tagName}"`);
  return result !== null;
}

async function deleteTagIfExists(tagName) {
  console.log(`Checking for existing tag ${tagName}...`);

  if (!tagExists(tagName)) {
    console.log(`✓ Tag ${tagName} does not exist, continuing...`);
    process.exit(0);
  }

  console.log(`Warning: Tag ${tagName} already exists.`);
  const answer = await promptUser(`Delete and recreate tag ${tagName}? [y/N] `);

  if (answer === 'y' || answer === 'yes') {
    console.log(`Deleting existing tag ${tagName}...`);

    // Delete local tag
    try {
      executeGitCommand(`git tag -d "${tagName}"`);
      console.log(`✓ Deleted local tag ${tagName}`);
    } catch (error) {
      console.log(`Note: Local tag ${tagName} may not exist`);
    }

    // Delete remote tag
    try {
      executeGitCommand(`git push --delete origin "${tagName}"`);
      console.log(`✓ Deleted remote tag ${tagName}`);
    } catch (error) {
      console.log(`Note: Remote tag ${tagName} may not exist`);
    }

    console.log(`✓ Tag ${tagName} cleaned up successfully`);
    process.exit(0);
  } else {
    console.log('Aborting release.');
    process.exit(1);
  }
}

function main() {
  const tagName = process.argv[2];

  if (!tagName) {
    console.error('Usage: node delete-tag-if-exists.js <tag-name>');
    console.error('Example: node delete-tag-if-exists.js v1.0.0');
    process.exit(1);
  }

  deleteTagIfExists(tagName).catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
