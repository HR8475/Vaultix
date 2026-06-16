import fs from 'fs';
import path from 'path';
import os from 'os';

const GLOBAL_DIR = path.join(os.homedir(), '.vaultix');
const SESSION_FILE = path.join(GLOBAL_DIR, 'session.json');
const PROJECT_FILE = path.join(process.cwd(), '.vaultix.json');

/**
 * Save auth token globally
 * @param {string} token - JWT authentication token
 */
export function saveSession(token) {
  try {
    if (!fs.existsSync(GLOBAL_DIR)) {
      fs.mkdirSync(GLOBAL_DIR, { recursive: true });
    }
    fs.writeFileSync(SESSION_FILE, JSON.stringify({ token }, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save session:', err.message);
  }
}

/**
 * Get global auth token
 * @returns {string|null} JWT token or null
 */
export function getSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.token || null;
    }
  } catch (err) {
    // If corrupt, clean it up
    clearSession();
  }
  return null;
}

/**
 * Delete session token
 */
export function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch (err) {
    console.error('Failed to clear session:', err.message);
  }
}

/**
 * Save project workspace configuration locally in .vaultix.json
 * @param {object} config - Project link details
 */
export function saveProjectConfig(config) {
  try {
    fs.writeFileSync(PROJECT_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write project config:', err.message);
  }
}

/**
 * Get local project workspace configuration
 * @returns {object|null} config or null
 */
export function getProjectConfig() {
  try {
    if (fs.existsSync(PROJECT_FILE)) {
      const data = fs.readFileSync(PROJECT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Silently ignore or return null
  }
  return null;
}
