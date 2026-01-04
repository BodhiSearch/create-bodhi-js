#!/usr/bin/env node

/**
 * Check if git repository has pushed branch
 * Allows uncommitted changes, but requires branch to be pushed to remote
 * Exit with code 0 if everything is OK, 1 otherwise
 */

import { execSync } from 'child_process';
import readline from 'readline';

function executeGitCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Error executing: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function checkGitSync() {
  console.log('Checking git repository status...');

  // Check for uncommitted changes (allowed, just informational)
  const status = executeGitCommand('git status --porcelain');
  if (status) {
    console.log('ℹ  You have uncommitted changes (this is allowed):');
    console.log(status);
  } else {
    console.log('✓ No uncommitted changes');
  }

  // Fetch latest changes from remote
  console.log('Fetching latest changes from remote...');
  executeGitCommand('git fetch origin main');

  // Check if there are unpushed commits (NOT allowed)
  const unpushedCommits = executeGitCommand('git log origin/main..HEAD --oneline');
  if (unpushedCommits) {
    console.error('Error: You have unpushed commits:');
    console.error(unpushedCommits);
    console.error('Please push your commits before releasing.');
    process.exit(1);
  }

  console.log('✓ No unpushed commits');

  // Check if there are unpulled commits
  const unpulledCommits = executeGitCommand('git log HEAD..origin/main --oneline');
  if (unpulledCommits) {
    console.log('Warning: There are unpulled commits from origin/main:');
    console.log(unpulledCommits);

    const answer = await promptUser('Continue anyway? [y/N] ');

    if (answer === 'y' || answer === 'yes') {
      console.log('Continuing with unpulled commits...');
    } else {
      console.log('Aborting release.');
      process.exit(1);
    }
  } else {
    console.log('✓ Branch is in sync with origin/main');
  }

  console.log('✓ Git repository is ready for release');
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkGitSync().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
