import { loadTestEnv } from './env.js';

async function globalSetup() {
  loadTestEnv();
}

export default globalSetup;
