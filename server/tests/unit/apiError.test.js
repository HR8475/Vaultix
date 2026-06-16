import { describe, it, expect } from 'vitest';
import ApiError from '../../utils/ApiError.js';

describe('ApiError Utility', () => {
  it('should instantiate correctly', () => {
    const error = new ApiError(418, 'I am a teapot', ['short and stout']);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe('I am a teapot');
    expect(error.errors).toEqual(['short and stout']);
  });

  it('should create a 400 Bad Request error', () => {
    const error = ApiError.badRequest('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
  });

  it('should create a 401 Unauthorized error', () => {
    const error = ApiError.unauthorized('Please login');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Please login');
  });

  it('should create a 403 Forbidden error', () => {
    const error = ApiError.forbidden('Access denied');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access denied');
  });

  it('should create a 404 Not Found error', () => {
    const error = ApiError.notFound('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
  });

  it('should create a 409 Conflict error', () => {
    const error = ApiError.conflict('User already exists');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('User already exists');
  });

  it('should create a 500 Internal error', () => {
    const error = ApiError.internal('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Something went wrong');
  });
});
