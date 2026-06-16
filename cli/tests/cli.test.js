import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  saveSession,
  getSession,
  clearSession,
  saveProjectConfig,
  getProjectConfig,
} from '../src/utils/configStore.js';

test('Vaultix Config Store Suite', async (t) => {
  // Save original session if any, so we don't destroy user state
  const originalSession = getSession();

  await t.test('should correctly store and retrieve JWT session tokens', () => {
    const testToken = 'ey-mock-token-abc-123';
    saveSession(testToken);
    
    const retrieved = getSession();
    assert.strictEqual(retrieved, testToken);
  });

  await t.test('should correctly delete session token on logout', () => {
    clearSession();
    const retrieved = getSession();
    assert.strictEqual(retrieved, null);
  });

  await t.test('should write and read project configuration in the workspace', () => {
    const mockConfig = {
      workspaceId: 'ws_test_99',
      workspaceName: 'Test Workspace',
      projectId: 'proj_test_99',
      projectName: 'Test Project',
      environmentId: 'env_test_99',
      environmentName: 'Development',
    };

    saveProjectConfig(mockConfig);
    const retrieved = getProjectConfig();

    assert.deepStrictEqual(retrieved, mockConfig);

    // Clean up local test file
    const localFile = path.join(process.cwd(), '.vaultix.json');
    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }
  });

  // Restore user session if it existed
  if (originalSession) {
    saveSession(originalSession);
  }
});
