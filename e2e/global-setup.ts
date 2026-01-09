import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalSetup() {
  config({ path: resolve(__dirname, '../.env.test'), override: true, quiet: true });

  const requiredEnvVars = ['TEST_DEV_CLIENT_ID', 'TEST_BODHI_USERNAME', 'TEST_BODHI_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please create .env.test file from .env.test.example and fill in the values.'
    );
  }
}

export default globalSetup;
