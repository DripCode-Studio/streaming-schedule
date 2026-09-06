import { describe, it, expect } from 'vitest';
import { baseSlug, uniqueSlug } from '../slug';

describe('baseSlug', () => {
  it('lowercases and dashes a title', () => {
    expect(baseSlug('Virtual Machine in C')).toBe('virtual-machine-in-c');
  });

  it('strips punctuation', () => {
    expect(baseSlug("Building JWT Authentication!")).toBe('building-jwt-authentication');
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when it is free', async () => {
    const result = await uniqueSlug('Virtual Machine in C', async () => false);
    expect(result).toBe('virtual-machine-in-c');
  });

  it('appends an incrementing suffix until a free slug is found', async () => {
    const taken = new Set(['virtual-machine-in-c', 'virtual-machine-in-c-2']);
    const result = await uniqueSlug('Virtual Machine in C', async (candidate) => taken.has(candidate));
    expect(result).toBe('virtual-machine-in-c-3');
  });
});
