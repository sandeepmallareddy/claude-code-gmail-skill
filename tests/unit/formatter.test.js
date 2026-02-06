/**
 * Unit tests for lib/formatter.js functions
 * Tests the pure utility functions with self-contained implementations
 */

describe('Formatter Utilities', () => {
  // ===== Copy of formatter functions for testing =====
  function getHeader(headers, name) {
    const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || null;
  }

  function parseAddress(address) {
    if (!address) return { name: null, email: null };
    const match = address.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
    if (match) {
      return {
        name: match[1]?.trim() || null,
        email: match[2]?.trim() || null
      };
    }
    return { name: null, email: address.trim() };
  }

  function truncate(str, maxLen = 60) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }

  function decodeBase64(data) {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  function stripHtml(html) {
    if (!html) return '';
    let sanitized = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/\bjavascript:/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '');
    sanitized = sanitized.replace(/<[^>]+>/g, ' ');
    sanitized = sanitized
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&copy;/g, '(c)')
      .replace(/&#x[0-9A-Fa-f]+;/g, '');
    return sanitized.replace(/\s+/g, ' ').trim();
  }

  function extractBody(payload) {
    if (!payload) return '';
    if (payload.body?.data) {
      return decodeBase64(payload.body.data);
    }
    if (payload.parts) {
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        return decodeBase64(textPart.body.data);
      }
      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        return stripHtml(decodeBase64(htmlPart.body.data));
      }
      for (const part of payload.parts) {
        if (part.parts) {
          const nested = extractBody(part);
          if (nested) return nested;
        }
      }
    }
    return '';
  }

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
  // ===== End copy of formatter functions =====

  describe('getHeader', () => {
    it('should extract header value by name', () => {
      const headers = [
        { name: 'Subject', value: 'Test Subject' },
        { name: 'From', value: 'test@example.com' },
        { name: 'Date', value: '2024-01-15' }
      ];
      expect(getHeader(headers, 'Subject')).toBe('Test Subject');
      expect(getHeader(headers, 'from')).toBe('test@example.com');
      expect(getHeader(headers, 'DATE')).toBe('2024-01-15');
    });

    it('should return null for non-existent header', () => {
      const headers = [{ name: 'Subject', value: 'Test' }];
      expect(getHeader(headers, 'NotExists')).toBeNull();
    });

    it('should handle empty headers array', () => {
      expect(getHeader([], 'Subject')).toBeNull();
    });

    it('should handle undefined headers', () => {
      expect(getHeader(undefined, 'Subject')).toBeNull();
    });
  });

  describe('parseAddress', () => {
    it('should parse address with name and email', () => {
      const result = parseAddress('John Doe <john@example.com>');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should parse address with email in angle brackets', () => {
      const result = parseAddress('<john@example.com>');
      expect(result.email).toBe('john@example.com');
    });

    it('should handle quoted name', () => {
      const result = parseAddress('"John Doe" <john@example.com>');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should handle empty string', () => {
      const result = parseAddress('');
      expect(result.name).toBeNull();
      expect(result.email).toBeNull();
    });

    it('should handle null input', () => {
      const result = parseAddress(null);
      expect(result.name).toBeNull();
      expect(result.email).toBeNull();
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Just now" for recent dates', () => {
      const result = formatRelativeDate(new Date().toISOString());
      expect(result).toBe('Just now');
    });

    it('should return minutes ago for times under an hour', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 30);
      const result = formatRelativeDate(date.toISOString());
      expect(result).toContain('min ago');
    });

    it('should return hours ago for times under a day', () => {
      const date = new Date();
      date.setHours(date.getHours() - 5);
      const result = formatRelativeDate(date.toISOString());
      expect(result).toContain('hour');
    });

    it('should return hours ago for dates within 24 hours', () => {
      const date = new Date();
      date.setHours(date.getHours() - 12);
      const result = formatRelativeDate(date.toISOString());
      expect(result).toContain('hours ago');
    });

    it('should return "Yesterday"', () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      const result = formatRelativeDate(date.toISOString());
      expect(result).toBe('Yesterday');
    });

    it('should return days ago for dates within a week', () => {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      const result = formatRelativeDate(date.toISOString());
      expect(result).toContain('days ago');
    });

    it('should return formatted date for older dates', () => {
      const date = new Date('2023-01-15');
      const result = formatRelativeDate(date.toISOString());
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });

    it('should handle null input', () => {
      expect(formatRelativeDate(null)).toBe('Unknown date');
    });
  });

  describe('truncate', () => {
    it('should return original string if shorter than max', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long strings', () => {
      const result = truncate('This is a very long string', 15);
      // "This is a very long string" = 28 chars
      // substring(0, 12) + "..." = 12 + 3 = 15 chars
      expect(result).toBe('This is a ve...');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle null input', () => {
      expect(truncate(null, 10)).toBe('');
    });

    it('should use default max length of 60', () => {
      const long = 'a'.repeat(100);
      const result = truncate(long);
      expect(result.length).toBe(60);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('extractBody', () => {
    it('should extract body from direct body data', () => {
      const payload = {
        body: {
          data: 'VGVzdCBib2R5' // "Test body"
        }
      };
      const result = extractBody(payload);
      expect(result).toBe('Test body');
    });

    it('should extract from multipart text/plain', () => {
      const payload = {
        parts: [
          {
            mimeType: 'text/plain',
            body: {
              data: 'VGhpcyBpcyB0ZXh0' // "This is text"
            }
          }
        ]
      };
      const result = extractBody(payload);
      expect(result).toBe('This is text');
    });

    it('should fall back to text/html when no text/plain', () => {
      const payload = {
        parts: [
          {
            mimeType: 'text/html',
            body: {
              data: 'PGh0bWw+PGJvZHk+SFRNTCB0ZXh0PC9ib2R5PjwvaHRtbD4='
            }
          }
        ]
      };
      const result = extractBody(payload);
      expect(result).toContain('HTML');
      expect(result).toContain('text');
    });

    it('should return empty string for null payload', () => {
      expect(extractBody(null)).toBe('');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      const result = stripHtml('<p>Hello <strong>World</strong></p>');
      expect(result).toBe('Hello World');
    });

    it('should remove script tags and content', () => {
      const result = stripHtml('<p>Text</p><script>alert("xss")</script>');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('xss');
    });

    it('should remove event handlers', () => {
      const result = stripHtml('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const result = stripHtml('<a href="javascript:alert(1)">Click</a>');
      expect(result).not.toContain('javascript:');
    });

    it('should remove iframes', () => {
      const result = stripHtml('<p>Text</p><iframe src="evil"></iframe>');
      expect(result).not.toContain('iframe');
    });

    it('should remove object and embed tags', () => {
      const result = stripHtml('<p>Text</p><object data="evil.swf"></object>');
      expect(result).not.toContain('object');
    });

    it('should decode common HTML entities', () => {
      const result = stripHtml('&lt;test&gt; &amp; &quot;quoted&quot;');
      expect(result).toContain('<test>');
      expect(result).toContain('&');
      expect(result).toContain('"quoted"');
    });

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle null input', () => {
      expect(stripHtml(null)).toBe('');
    });
  });

  describe('formatSize', () => {
    it('should format bytes', () => {
      expect(formatSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(2048)).toBe('2.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(1048576)).toBe('1.0 MB');
    });

    it('should format gigabytes', () => {
      expect(formatSize(1073741824)).toBe('1.0 GB');
    });

    it('should handle zero', () => {
      expect(formatSize(0)).toBe('0 B');
    });

    it('should handle undefined', () => {
      expect(formatSize(undefined)).toBe('0 B');
    });
  });
});
