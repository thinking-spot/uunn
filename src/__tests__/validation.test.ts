import { describe, it, expect } from 'vitest';
import {
  uuid,
  encryptedPayload,
  title,
  username,
  messageContent,
  createVoteInput,
  validate,
} from '@/lib/validation';

describe('UUID validation', () => {
  it('accepts valid UUIDs', () => {
    const result = validate(uuid, '550e8400-e29b-41d4-a716-446655440000');
    expect('data' in result).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    const result = validate(uuid, 'not-a-uuid');
    expect('error' in result).toBe(true);
  });

  it('rejects empty string', () => {
    const result = validate(uuid, '');
    expect('error' in result).toBe(true);
  });
});

describe('Encrypted payload validation', () => {
  it('accepts valid payload', () => {
    const result = validate(encryptedPayload, 'base64encodedciphertext==');
    expect('data' in result).toBe(true);
  });

  it('rejects payload exceeding max size', () => {
    const result = validate(encryptedPayload, 'x'.repeat(500_001));
    expect('error' in result).toBe(true);
  });
});

describe('Title validation', () => {
  it('accepts valid title', () => {
    const result = validate(title, 'Union Vote: Strike Authorization');
    expect('data' in result).toBe(true);
  });

  it('rejects empty title', () => {
    const result = validate(title, '');
    expect('error' in result).toBe(true);
  });

  it('rejects title exceeding max length', () => {
    const result = validate(title, 'x'.repeat(501));
    expect('error' in result).toBe(true);
  });
});

describe('Username validation', () => {
  it('accepts valid username', () => {
    const result = validate(username, 'worker42');
    expect('data' in result).toBe(true);
  });

  it('rejects too-short username', () => {
    const result = validate(username, 'ab');
    expect('error' in result).toBe(true);
  });

  it('rejects too-long username', () => {
    const result = validate(username, 'x'.repeat(51));
    expect('error' in result).toBe(true);
  });
});

describe('Message content validation', () => {
  it('accepts valid message content', () => {
    const result = validate(messageContent, {
      unionId: '550e8400-e29b-41d4-a716-446655440000',
      contentBlob: 'encrypted-content-here',
      iv: 'initialization-vector',
    });
    expect('data' in result).toBe(true);
  });

  it('accepts message with optional id', () => {
    const result = validate(messageContent, {
      unionId: '550e8400-e29b-41d4-a716-446655440000',
      contentBlob: 'encrypted',
      iv: 'iv',
      id: '660e8400-e29b-41d4-a716-446655440000',
    });
    expect('data' in result).toBe(true);
  });

  it('rejects message with invalid union ID', () => {
    const result = validate(messageContent, {
      unionId: 'bad-id',
      contentBlob: 'encrypted',
      iv: 'iv',
    });
    expect('error' in result).toBe(true);
  });
});

describe('Create vote input validation', () => {
  it('accepts valid vote input', () => {
    const result = validate(createVoteInput, {
      unionId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Strike Vote',
      description: 'Should we authorize a strike?',
    });
    expect('data' in result).toBe(true);
  });

  it('rejects vote with empty title', () => {
    const result = validate(createVoteInput, {
      unionId: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
      description: 'Description',
    });
    expect('error' in result).toBe(true);
  });

  it('rejects too many attachments', () => {
    const result = validate(createVoteInput, {
      unionId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Vote',
      description: 'Desc',
      documentIds: Array(21).fill('550e8400-e29b-41d4-a716-446655440000'),
    });
    expect('error' in result).toBe(true);
  });
});

describe('validate helper', () => {
  it('returns parsed data on success', () => {
    const result = validate(username, 'validuser');
    expect(result).toEqual({ data: 'validuser' });
  });

  it('returns error message on failure', () => {
    const result = validate(username, 'ab');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(typeof result.error).toBe('string');
    }
  });
});
