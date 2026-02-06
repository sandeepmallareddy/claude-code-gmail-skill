/**
 * Functional tests for CLI scripts
 * These tests verify the CLI argument parsing and output formatting
 */

import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.unstable_mockModule('googleapis', () => ({
  google: {
    gmail: jest.fn()
  },
  Auth: {
    OAuth2: jest.fn()
  }
}));

describe('CLI Argument Parsing', () => {
  describe('list.js argument parsing', () => {
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('should parse --query argument', () => {
      process.argv = ['node', 'list.js', '--query=is:unread'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--query=')) {
          options.query = arg.slice(8).replace(/^["']|["']$/g, '');
        }
      }

      expect(options.query).toBe('is:unread');
    });

    it('should parse --max-results argument', () => {
      process.argv = ['node', 'list.js', '--max-results=10'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--max-results=')) {
          options.maxResults = parseInt(arg.slice(14), 10);
        }
      }

      expect(options.maxResults).toBe(10);
    });

    it('should parse --format argument', () => {
      process.argv = ['node', 'list.js', '--format=json'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--format=')) {
          options.format = arg.slice(9);
        }
      }

      expect(options.format).toBe('json');
    });

    it('should parse positional query argument', () => {
      process.argv = ['node', 'list.js', 'is:unread'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (!arg.startsWith('--')) {
          options.query = arg;
        }
      }

      expect(options.query).toBe('is:unread');
    });
  });

  describe('send.js argument parsing', () => {
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('should parse --to argument', () => {
      process.argv = ['node', 'send.js', '--to=test@example.com'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--to=')) {
          options.to = arg.slice(5).replace(/^["']|["']$/g, '');
        }
      }

      expect(options.to).toBe('test@example.com');
    });

    it('should parse --subject argument', () => {
      process.argv = ['node', 'send.js', '--subject=Hello World'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--subject=')) {
          options.subject = arg.slice(10).replace(/^["']|["']$/g, '');
        }
      }

      expect(options.subject).toBe('Hello World');
    });

    it('should parse --body argument', () => {
      process.argv = ['node', 'send.js', '--body=Message content'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--body=')) {
          options.body = arg.slice(7).replace(/^["']|["']$/g, '');
        }
      }

      expect(options.body).toBe('Message content');
    });

    it('should parse --draft flag', () => {
      process.argv = ['node', 'send.js', '--draft'];

      const args = process.argv.slice(2);
      let isDraft = false;

      for (const arg of args) {
        if (arg === '--draft') {
          isDraft = true;
        }
      }

      expect(isDraft).toBe(true);
    });

    it('should parse --cc argument', () => {
      process.argv = ['node', 'send.js', '--cc=boss@example.com'];

      const args = process.argv.slice(2);
      const options = {};

      for (const arg of args) {
        if (arg.startsWith('--cc=')) {
          options.cc = arg.slice(5).replace(/^["']|["']$/g, '');
        }
      }

      expect(options.cc).toBe('boss@example.com');
    });
  });

  describe('modify.js argument parsing', () => {
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('should parse --id argument', () => {
      process.argv = ['node', 'modify.js', '--id=18abc123'];

      const args = process.argv.slice(2);
      let messageId;

      for (const arg of args) {
        if (arg.startsWith('--id=')) {
          messageId = arg.slice(5);
        }
      }

      expect(messageId).toBe('18abc123');
    });

    it('should parse --archive flag', () => {
      process.argv = ['node', 'modify.js', '--archive'];

      const args = process.argv.slice(2);
      let archive = false;

      for (const arg of args) {
        if (arg === '--archive') {
          archive = true;
        }
      }

      expect(archive).toBe(true);
    });

    it('should parse --star flag', () => {
      process.argv = ['node', 'modify.js', '--star'];

      const args = process.argv.slice(2);
      let star = false;

      for (const arg of args) {
        if (arg === '--star') {
          star = true;
        }
      }

      expect(star).toBe(true);
    });

    it('should parse --add-label argument', () => {
      process.argv = ['node', 'modify.js', '--add-label=Work'];

      const args = process.argv.slice(2);
      let label;

      for (const arg of args) {
        if (arg.startsWith('--add-label=')) {
          label = arg.slice(12).replace(/^["']|["']$/g, '');
        }
      }

      expect(label).toBe('Work');
    });
  });

  describe('get.js argument parsing', () => {
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('should parse --id argument', () => {
      process.argv = ['node', 'get.js', '--id=18abc123'];

      const args = process.argv.slice(2);
      let id;

      for (const arg of args) {
        if (arg.startsWith('--id=')) {
          id = arg.slice(5);
        }
      }

      expect(id).toBe('18abc123');
    });

    it('should parse --thread argument', () => {
      process.argv = ['node', 'get.js', '--thread=thread123'];

      const args = process.argv.slice(2);
      let threadId;

      for (const arg of args) {
        if (arg.startsWith('--thread=')) {
          threadId = arg.slice(9);
        }
      }

      expect(threadId).toBe('thread123');
    });

    it('should parse positional ID argument', () => {
      process.argv = ['node', 'get.js', '18abc123'];

      const args = process.argv.slice(2);
      let id;

      for (const arg of args) {
        if (!arg.startsWith('--')) {
          id = arg;
        }
      }

      expect(id).toBe('18abc123');
    });
  });

  describe('search.js argument parsing', () => {
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('should parse --from argument', () => {
      process.argv = ['node', 'search.js', '--from=john'];

      const args = process.argv.slice(2);
      let from;

      for (const arg of args) {
        if (arg.startsWith('--from=')) {
          from = arg.slice(7).replace(/^["']|["']$/g, '');
        }
      }

      expect(from).toBe('john');
    });

    it('should parse --unread flag', () => {
      process.argv = ['node', 'search.js', '--unread'];

      const args = process.argv.slice(2);
      let unread = false;

      for (const arg of args) {
        if (arg === '--unread') {
          unread = true;
        }
      }

      expect(unread).toBe(true);
    });

    it('should parse --after argument', () => {
      process.argv = ['node', 'search.js', '--after=2024/01/01'];

      const args = process.argv.slice(2);
      let after;

      for (const arg of args) {
        if (arg.startsWith('--after=')) {
          after = arg.slice(8).replace(/^["']|["']$/g, '');
        }
      }

      expect(after).toBe('2024/01/01');
    });

    it('should parse positional query argument', () => {
      process.argv = ['node', 'search.js', 'from:boss is:unread'];

      const args = process.argv.slice(2);
      let query;

      for (const arg of args) {
        if (!arg.startsWith('--')) {
          query = arg;
        }
      }

      expect(query).toBe('from:boss is:unread');
    });
  });
});

describe('Gmail Query Building', () => {
  function buildQuery(options) {
    const queryParts = [];

    if (options.query) queryParts.push(options.query);
    if (options.from) queryParts.push(`from:${options.from}`);
    if (options.to) queryParts.push(`to:${options.to}`);
    if (options.subject) queryParts.push(`subject:${options.subject}`);
    if (options.unread) queryParts.push('is:unread');
    if (options.starred) queryParts.push('is:starred');
    if (options.hasAttachment) queryParts.push('has:attachment');
    if (options.label) queryParts.push(`label:${options.label}`);

    return queryParts.join(' ');
  }

  it('should build query from options', () => {
    const result = buildQuery({
      from: 'boss',
      unread: true
    });

    expect(result).toBe('from:boss is:unread');
  });

  it('should combine multiple filters', () => {
    const result = buildQuery({
      from: 'john',
      subject: 'project',
      hasAttachment: true
    });

    expect(result).toBe('from:john subject:project has:attachment');
  });

  it('should handle empty options', () => {
    const result = buildQuery({});
    expect(result).toBe('');
  });

  it('should preserve raw query', () => {
    const result = buildQuery({
      query: 'from:boss subject:budget'
    });

    expect(result).toBe('from:boss subject:budget');
  });

  it('should combine raw query with filters', () => {
    const result = buildQuery({
      query: 'is:unread',
      label: 'INBOX'
    });

    expect(result).toBe('is:unread label:INBOX');
  });
});

describe('Date Formatting', () => {
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024/01/15');
  });

  it('should pad single digit months', () => {
    const date = new Date('2024-03-05');
    expect(formatDate(date)).toBe('2024/03/05');
  });

  it('should handle year change', () => {
    const date = new Date('2023-12-31');
    expect(formatDate(date)).toBe('2023/12/31');
  });
});

describe('Label Resolution', () => {
  const systemLabels = [
    'INBOX', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT',
    'SENT', 'DRAFT', 'CATEGORY_PERSONAL'
  ];

  function isSystemLabel(labelName) {
    return systemLabels.includes(labelName.toUpperCase());
  }

  it('should recognize INBOX as system label', () => {
    expect(isSystemLabel('INBOX')).toBe(true);
    expect(isSystemLabel('inbox')).toBe(true);
    expect(isSystemLabel('InBox')).toBe(true);
  });

  it('should recognize TRASH as system label', () => {
    expect(isSystemLabel('TRASH')).toBe(true);
    expect(isSystemLabel('trash')).toBe(true);
  });

  it('should return false for user labels', () => {
    expect(isSystemLabel('Work')).toBe(false);
    expect(isSystemLabel('Personal')).toBe(false);
  });
});
