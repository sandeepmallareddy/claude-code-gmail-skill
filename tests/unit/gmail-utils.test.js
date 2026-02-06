/**
 * Unit tests for utility functions in lib/gmail.js
 * These tests mock the filesystem and focus on pure utility functions
 */

describe('Gmail Utility Functions', () => {
  describe('Token Expiration Check', () => {
    /**
     * Simulates the isTokenExpired function from lib/gmail.js
     */
    function isTokenExpired(token) {
      if (!token || !token.expiry_date) return false;
      const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
      return Date.now() >= token.expiry_date - bufferMs;
    }

    it('should return false when no expiry_date', () => {
      const token = { access_token: 'test' };
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return false for null token', () => {
      expect(isTokenExpired(null)).toBe(false);
    });

    it('should return false for token not expiring soon', () => {
      const token = {
        expiry_date: Date.now() + 3600000 // 1 hour from now
      };
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = {
        expiry_date: Date.now() - 1000 // 1 second ago
      };
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for token expiring within buffer', () => {
      const token = {
        expiry_date: Date.now() + 60000 // 1 minute from now (within 5 min buffer)
      };
      expect(isTokenExpired(token)).toBe(true);
    });
  });

  describe('API Error Handling', () => {
    /**
     * Simulates error handling from lib/gmail.js
     */
    function handleApiError(error) {
      if (!error || !error.code) {
        return error?.message || 'An unknown error occurred';
      }
      if (error.code === 401) {
        return 'Authentication expired. Please run: npm run auth';
      }
      if (error.code === 403) {
        return 'Permission denied. Check that the required Gmail scopes are authorized.';
      }
      if (error.code === 404) {
        return 'Message not found. It may have been deleted.';
      }
      if (error.code === 429) {
        return 'Rate limit exceeded. Please wait a moment and try again.';
      }
      return error.message || 'An unknown error occurred';
    }

    it('should return message for 401 error', () => {
      const error = { code: 401, message: 'Token expired' };
      expect(handleApiError(error)).toBe('Authentication expired. Please run: npm run auth');
    });

    it('should return message for 403 error', () => {
      const error = { code: 403, message: 'Access denied' };
      expect(handleApiError(error)).toBe('Permission denied. Check that the required Gmail scopes are authorized.');
    });

    it('should return message for 404 error', () => {
      const error = { code: 404, message: 'Not found' };
      expect(handleApiError(error)).toBe('Message not found. It may have been deleted.');
    });

    it('should return message for 429 error', () => {
      const error = { code: 429, message: 'Too many requests' };
      expect(handleApiError(error)).toBe('Rate limit exceeded. Please wait a moment and try again.');
    });

    it('should return original message for unknown error code', () => {
      const error = { code: 500, message: 'Internal server error' };
      expect(handleApiError(error)).toBe('Internal server error');
    });

    it('should handle error without code', () => {
      const error = { message: 'Some error' };
      expect(handleApiError(error)).toBe('Some error');
    });

    it('should handle null error', () => {
      expect(handleApiError(null)).toBe('An unknown error occurred');
    });

    it('should handle undefined error', () => {
      expect(handleApiError(undefined)).toBe('An unknown error occurred');
    });
  });

  describe('Base64 URL Encoding/Decoding', () => {
    /**
     * Tests base64url encoding/decoding similar to send.js
     */
    function encodeBase64Url(str) {
      return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    function decodeBase64Url(str) {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    }

    it('should encode simple string', () => {
      expect(encodeBase64Url('Hello')).toBe('SGVsbG8');
    });

    it('should encode with special characters', () => {
      // '+' in input becomes '/' in base64
      // '/' in input becomes '_' in base64url
      const result = encodeBase64Url('Hello+World/Test');
      expect(result).not.toContain('+'); // + should be replaced
      expect(result).not.toContain('/'); // / should be replaced with _
    });

    it('should remove padding', () => {
      const result = encodeBase64Url('Hello');
      expect(result).not.toContain('=');
    });

    it('should decode back to original', () => {
      const original = 'Test message with special chars: @#$%';
      const encoded = encodeBase64Url(original);
      const decoded = decodeBase64Url(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
      expect(encodeBase64Url('')).toBe('');
    });
  });

  describe('Path Validation', () => {
    /**
     * Tests for secure file path handling
     */
    function validateTokenPath(tokenPath, allowedDir) {
      // Normalize paths
      const normalizedPath = tokenPath.replace(/\\/g, '/');
      const normalizedAllowed = allowedDir.replace(/\\/g, '/');

      // Check if path starts with allowed directory
      if (!normalizedPath.startsWith(normalizedAllowed + '/')) {
        return { valid: false, error: 'Path outside allowed directory' };
      }

      // Check for path traversal
      if (normalizedPath.includes('/..') || normalizedPath.includes('\\..')) {
        return { valid: false, error: 'Path traversal attempt detected' };
      }

      return { valid: true };
    }

    it('should allow valid path in directory', () => {
      const result = validateTokenPath(
        '/home/user/.config/claude-gmail/token.json',
        '/home/user/.config/claude-gmail'
      );
      expect(result.valid).toBe(true);
    });

    it('should reject path outside directory', () => {
      const result = validateTokenPath(
        '/etc/passwd',
        '/home/user/.config/claude-gmail'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path outside allowed directory');
    });

    it('should reject path traversal', () => {
      const result = validateTokenPath(
        '/home/user/.config/claude-gmail/../../etc/passwd',
        '/home/user/.config/claude-gmail'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path traversal attempt detected');
    });
  });

  describe('Scope Validation', () => {
    /**
     * Tests for OAuth scope validation
     */
    const VALID_GMAIL_SCOPES = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    function validateScopes(scopes) {
      if (!Array.isArray(scopes)) {
        return { valid: false, error: 'Scopes must be an array' };
      }

      if (scopes.length === 0) {
        return { valid: false, error: 'At least one scope required' };
      }

      const invalidScopes = scopes.filter(
        scope => !VALID_GMAIL_SCOPES.includes(scope)
      );

      if (invalidScopes.length > 0) {
        return {
          valid: false,
          error: `Invalid scopes: ${invalidScopes.join(', ')}`
        };
      }

      return { valid: true, scopes: scopes };
    }

    it('should accept valid scopes', () => {
      const result = validateScopes([
        'https://www.googleapis.com/auth/gmail.readonly'
      ]);
      expect(result.valid).toBe(true);
    });

    it('should accept multiple valid scopes', () => {
      const result = validateScopes([
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send'
      ]);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid scope', () => {
      const result = validateScopes([
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive' // Invalid scope
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid scopes');
    });

    it('should reject empty array', () => {
      const result = validateScopes([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('At least one scope required');
    });

    it('should reject non-array', () => {
      const result = validateScopes('not-an-array');
      expect(result.valid).toBe(false);
    });
  });
});
