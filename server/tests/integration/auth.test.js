import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/authRoutes.js';
import User from '../../models/User.js';
import RefreshToken from '../../models/RefreshToken.js';
import errorHandler from '../../middleware/errorHandler.js';

// Setup basic Express app for testing just the auth routes
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth Integration Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  let accessToken = '';
  let refreshToken = '';

  it('should sign up a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();

    // Check cookies
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    // Parse cookies simply for testing
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    
    expect(tokenCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    
    // Save tokens for future tests
    accessToken = res.body.data.token;
    refreshToken = refreshCookie.split(';')[0].split('=')[1];
  });

  it('should not sign up a user with an existing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(testUser)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email is already registered');
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    
    const cookies = res.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    refreshToken = refreshCookie.split(';')[0].split('=')[1];
  });

  it('should reject login with wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);
  });

  it('should return current user when hitting /me with token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should refresh session using refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    
    // Ensure old refresh token is marked revoked
    const oldTokenRecord = await RefreshToken.findOne({ token: refreshToken });
    expect(oldTokenRecord.isRevoked).toBe(true);
  });

  it('should logout and revoke token', async () => {
    // 1. Fetch current active session (from the refresh test)
    const user = await User.findOne({ email: testUser.email });
    const activeToken = await RefreshToken.findOne({ user: user._id, isRevoked: false });
    expect(activeToken).toBeDefined();

    // 2. Call logout
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', [`refreshToken=${activeToken.token}`])
      .expect(200);

    expect(res.body.success).toBe(true);
    
    // Check that cookies were cleared
    const cookies = res.headers['set-cookie'];
    const clearTokenCookie = cookies.find((c) => c.startsWith('token=;'));
    expect(clearTokenCookie).toBeDefined();

    // 3. Verify token is marked revoked in DB
    const tokenRecord = await RefreshToken.findOne({ token: activeToken.token });
    expect(tokenRecord.isRevoked).toBe(true);
  });
});
