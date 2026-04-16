import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const E2E_DIR = __dirname;
export const ENV_FILE = path.join(E2E_DIR, '.env.test');

export const REQUIRED_ENV_VARS = [
  'DEV_CLIENT_ID',
  'BODHIAPP_CLIENT_ID',
  'BODHIAPP_CLIENT_SECRET',
  'BODHIAPP_USERNAME',
  'BODHIAPP_USERID',
  'BODHIAPP_PASSWORD',
  'BODHIAPP_AUTH_URL',
  'BODHIAPP_AUTH_REALM',
  'OPENAI_API_KEY',
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

let loaded = false;

export function loadTestEnv(): void {
  if (loaded) return;
  loadEnv({ path: ENV_FILE, override: true, quiet: true });
  loaded = true;
}

export function validateEnv(): void {
  loadTestEnv();
  const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables in ${ENV_FILE}: ${missing.join(', ')}\n` +
        `Copy e2e/.env.test.example to e2e/.env.test and fill in the values.`
    );
  }
}

export function requireEnv(key: RequiredEnvVar): string {
  loadTestEnv();
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}
