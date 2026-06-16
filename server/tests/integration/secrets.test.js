import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import secretRoutes from '../../routes/secretRoutes.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Project from '../../models/Project.js';
import Environment from '../../models/Environment.js';
import * as authService from '../../services/authService.js';
import errorHandler from '../../middleware/errorHandler.js';
import config from '../../config/index.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/workspaces', secretRoutes);
app.use(errorHandler);

describe('Secret Integration Tests', () => {
  let token;
  let workspaceId;
  let projectId;
  let envId;
  let userId;

  beforeAll(async () => {
    // Seed test data
    const user = await User.create({
      name: 'Test',
      email: 'secret_test@example.com',
      password: 'password123',
    });
    userId = user._id;

    const workspace = await Workspace.create({
      name: 'Test Workspace',
      slug: 'test-workspace',
      owner: userId,
      members: [{ user: userId, role: 'owner' }],
    });
    workspaceId = workspace._id;

    const project = await Project.create({
      workspace: workspaceId,
      name: 'Test Project',
      slug: 'test-project',
      createdBy: userId,
    });
    projectId = project._id;

    const environment = await Environment.create({
      project: projectId,
      name: 'Development',
      slug: 'development',
      createdBy: userId,
    });
    envId = environment._id;

    token = authService.generateAccessToken(userId);
  });

  const baseUrl = () => `/api/v1/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets`;

  it('should create a new secret', async () => {
    const res = await request(app)
      .post(baseUrl())
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'DATABASE_URL',
        value: 'postgres://localhost:5432/db',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.secret.key).toBe('DATABASE_URL');
    expect(res.body.data.secret.value).toBe('********');
    expect(res.body.data.secret.version).toBe(1);
  });

  it('should list secrets (masked)', async () => {
    const res = await request(app)
      .get(baseUrl())
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.secrets.length).toBe(1);
    expect(res.body.data.secrets[0].key).toBe('DATABASE_URL');
    expect(res.body.data.secrets[0].value).toBe('********');
  });

  it('should reveal a secret', async () => {
    // Fetch list to get ID
    const listRes = await request(app)
      .get(baseUrl())
      .set('Authorization', `Bearer ${token}`);
    const secretId = listRes.body.data.secrets[0]._id;

    const res = await request(app)
      .get(`${baseUrl()}/${secretId}/reveal`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.plaintext).toBe('postgres://localhost:5432/db');
  });

  it('should support one-time access secret', async () => {
    const res = await request(app)
      .post(baseUrl())
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'ONE_TIME',
        value: 'disappears',
        oneTimeAccess: true,
      })
      .expect(201);

    const secretId = res.body.data.secret._id;

    // First read should work
    const revealRes = await request(app)
      .get(`${baseUrl()}/${secretId}/reveal`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(revealRes.body.data.plaintext).toBe('disappears');
    expect(revealRes.body.data.oneTimeAccessConsumed).toBe(true);

    // Second read should fail (404)
    await request(app)
      .get(`${baseUrl()}/${secretId}/reveal`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
