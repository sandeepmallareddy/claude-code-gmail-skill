/**
 * Format utilities for Gmail message output
 */

/**
 * Extract a header value from message headers array
 * @param {Array} headers - Array of header objects with name/value
 * @param {string} name - Header name to find
 * @returns {string|null} Header value or null
 */
export function getHeader(headers, name) {
  const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || null;
}

/**
 * Parse an email address string into name and email
 * @param {string} address - Email address string like "Name <email@example.com>"
 * @returns {object} Object with name and email properties
 */
export function parseAddress(address) {
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

/**
 * Format a date string to relative time
 * @param {string} dateStr - Date string from email header
 * @returns {string} Relative date string
 */
export function formatRelativeDate(dateStr) {
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

/**
 * Truncate a string to a maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLen - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Extract the body text from a message payload
 * @param {object} payload - Message payload object
 * @returns {string} Decoded body text
 */
export function extractBody(payload) {
  if (!payload) return '';

  // Direct body content
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Multipart message - look for text/plain or text/html
  if (payload.parts) {
    // First try to find text/plain
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return decodeBase64(textPart.body.data);
    }

    // Fall back to text/html
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return stripHtml(decodeBase64(htmlPart.body.data));
    }

    // Check nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

/**
 * Decode base64url encoded string
 * @param {string} data - Base64url encoded string
 * @returns {string} Decoded string
 */
function decodeBase64(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Strip HTML tags and potentially dangerous content from a string
 * @param {string} html - HTML string
 * @returns {string} Sanitized plain text
 */
function stripHtml(html) {
  if (!html) return '';

  // Remove scripts, styles, and event handlers
  let sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/\bjavascript:/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '');

  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, '(c)')
    .replace(/&#x[0-9A-Fa-f]+;/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Format a message summary for list display
 * @param {object} message - Gmail message object
 * @returns {object} Formatted summary
 */
export function formatMessageSummary(message) {
  const headers = message.payload?.headers || [];
  const subject = getHeader(headers, 'Subject') || '(No Subject)';
  const from = getHeader(headers, 'From');
  const date = getHeader(headers, 'Date');
  const to = getHeader(headers, 'To');

  const fromParsed = parseAddress(from);

  return {
    id: message.id,
    threadId: message.threadId,
    subject: truncate(subject, 80),
    from: fromParsed.name || fromParsed.email || 'Unknown',
    fromEmail: fromParsed.email,
    to: to,
    date: formatRelativeDate(date),
    rawDate: date,
    snippet: message.snippet ? truncate(message.snippet, 150) : '',
    labels: message.labelIds || [],
    isUnread: message.labelIds?.includes('UNREAD'),
    isStarred: message.labelIds?.includes('STARRED')
  };
}

/**
 * Format a full email for display
 * @param {object} message - Gmail message object
 * @returns {string} Formatted email text
 */
export function formatFullEmail(message) {
  const headers = message.payload?.headers || [];
  const subject = getHeader(headers, 'Subject') || '(No Subject)';
  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const cc = getHeader(headers, 'Cc');
  const date = getHeader(headers, 'Date');
  const body = extractBody(message.payload);

  let output = `**Subject:** ${subject}\n`;
  output += `**From:** ${from}\n`;
  output += `**To:** ${to}\n`;
  if (cc) output += `**Cc:** ${cc}\n`;
  output += `**Date:** ${date}\n`;
  output += `\n---\n\n`;
  output += body;
  output += `\n\n---\n`;
  output += `*Message ID: ${message.id} | Thread ID: ${message.threadId}*`;

  return output;
}

/**
 * Format messages as a list for display
 * @param {Array} messages - Array of formatted message summaries
 * @returns {string} Formatted list string
 */
export function formatMessageList(messages) {
  if (!messages || messages.length === 0) {
    return 'No messages found.';
  }

  return messages.map((msg, i) => {
    const unread = msg.isUnread ? '●' : '○';
    const starred = msg.isStarred ? '★' : '';
    return `${i + 1}. ${unread}${starred} **${msg.subject}**\n   From: ${msg.from} | ${msg.date}\n   ${msg.snippet}\n   ID: ${msg.id}`;
  }).join('\n\n');
}

/**
 * Format bytes to human readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Human readable size
 */
export function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
