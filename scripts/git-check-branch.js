#!/usr/bin/env node

/**
 * Check if current git branch is main
 * Exit with code 0 if on main branch, 1 otherwise
 */

import { execSync } from 'child_process';
import readline from 'readline';

function getCurrentBranch() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    return branch;
  } catch {
    console.error('Error: Unable to get current git branch');
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

async function checkBranch() {
  const currentBranch = getCurrentBranch();

  if (currentBranch === 'main') {
    console.log('✓ On main branch');
    process.exit(0);
  }

  console.log(`Warning: You are not on main branch (current: ${currentBranch})`);

  const answer = await promptUser('Continue anyway? [y/N] ');

  if (answer === 'y' || answer === 'yes') {
    console.log('Continuing with non-main branch...');
    process.exit(0);
  } else {
    console.log('Aborting release.');
    process.exit(1);
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkBranch().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
