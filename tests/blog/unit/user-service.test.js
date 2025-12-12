import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../../src/blog/services/user-service.js';
import { MemoryStorage } from '../../../src/blog/storage/memory-storage.js';

describe('UserService.ensureAdminUser', () => {
  let storage;
  let service;

  beforeEach(() => {
    storage = new MemoryStorage();
    service = new UserService(storage);
  });

  it('creates a bootstrap admin when no users exist and credentials are provided', async () => {
    const result = await service.ensureAdminUser({ username: 'admin1', password: 'P@ssw0rd!' });

    expect(result.created).toBe(true);
    expect(result.generatedPassword).toBe(false);
    expect(result.user.username).toBe('admin1');

    const stored = await storage.getUserByUsername('admin1');
    expect(stored).not.toBeNull();
    expect(await service.verifyPassword('P@ssw0rd!', stored.passwordHash)).toBe(true);
  });

  it('skips creation when a user already exists', async () => {
    await storage.createUser({ username: 'existing', passwordHash: await service.hashPassword('secret') });

    const result = await service.ensureAdminUser({ username: 'admin', password: 'another' });

    expect(result.created).toBe(false);
    expect(result.reason).toBe('users-exist');
  });

  it('generates a password when one is not provided', async () => {
    const result = await service.ensureAdminUser({ username: 'admin' });

    expect(result.created).toBe(true);
    expect(result.generatedPassword).toBe(true);
    expect(result.password).toBeDefined();
    expect(result.password.length).toBeGreaterThan(10);

    const stored = await storage.getUserByUsername('admin');
    expect(stored).not.toBeNull();
    expect(await service.verifyPassword(result.password, stored.passwordHash)).toBe(true);
  });
});
