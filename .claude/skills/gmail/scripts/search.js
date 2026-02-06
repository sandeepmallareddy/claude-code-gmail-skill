#!/usr/bin/env node

/**
 * Search Gmail Messages
 *
 * Usage:
 *   node search.js "from:john subject:project"
 *   node search.js --from="boss" --unread
 *   node search.js --after="2024-01-01" --has-attachment
 */

import { getGmailClient, handleApiError } from './lib/gmail.js';
import { formatMessageSummary, formatMessageList } from './lib/formatter.js';

async function searchMessages(options = {}) {
  const {
    query = '',
    from,
    to,
    subject,
    after,
    before,
    unread,
    starred,
    hasAttachment,
    label,
    maxResults = 20,
    format = 'text'
  } = options;

  try {
    const gmail = await getGmailClient();

    // Build Gmail query from options
    const queryParts = [];

    if (query) queryParts.push(query);
    if (from) queryParts.push(`from:${from}`);
    if (to) queryParts.push(`to:${to}`);
    if (subject) queryParts.push(`subject:${subject}`);
    if (after) queryParts.push(`after:${formatDateForQuery(after)}`);
    if (before) queryParts.push(`before:${formatDateForQuery(before)}`);
    if (unread) queryParts.push('is:unread');
    if (starred) queryParts.push('is:starred');
    if (hasAttachment) queryParts.push('has:attachment');
    if (label) queryParts.push(`label:${label}`);

    const finalQuery = queryParts.join(' ');

    if (!finalQuery) {
      console.error('Error: Please provide a search query');
      console.error('Examples:');
      console.error('  node search.js "from:boss"');
      console.error('  node search.js --unread');
      console.error('  node search.js --from="john" --subject="project"');
      process.exit(1);
    }

    // Execute search
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: finalQuery,
      maxResults: Math.min(maxResults, 100)
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      if (format === 'json') {
        console.log(JSON.stringify({ query: finalQuery, messages: [], total: 0 }));
      } else {
        console.log(`No messages found for query: "${finalQuery}"`);
      }
      return;
    }

    // Fetch message details
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'To', 'Date', 'Cc']
        });
        return formatMessageSummary(detail.data);
      })
    );

    // Output results
    if (format === 'json') {
      console.log(JSON.stringify({
        query: finalQuery,
        messages: detailedMessages,
        total: listResponse.data.resultSizeEstimate || messages.length,
        nextPageToken: listResponse.data.nextPageToken
      }, null, 2));
    } else {
      console.log(`Search: "${finalQuery}"`);
      console.log(`Found ${listResponse.data.resultSizeEstimate || messages.length} messages:\n`);
      console.log(formatMessageList(detailedMessages));

      if (listResponse.data.nextPageToken) {
        console.log(`\n(More results available)`);
      }
    }

  } catch (error) {
    console.error('Error:', handleApiError(error));
    process.exit(1);
  }
}

/**
 * Format date for Gmail query
 * @param {string} dateStr - Date string (YYYY-MM-DD or relative like "today", "yesterday")
 * @returns {string} Formatted date for Gmail query
 */
function formatDateForQuery(dateStr) {
  const lowerDate = dateStr.toLowerCase();

  // Handle relative dates
  if (lowerDate === 'today') {
    return formatDate(new Date());
  }
  if (lowerDate === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }
  if (lowerDate.endsWith('d') || lowerDate.endsWith('days')) {
    const days = parseInt(lowerDate, 10);
    const d = new Date();
    d.setDate(d.getDate() - days);
    return formatDate(d);
  }
  if (lowerDate.endsWith('w') || lowerDate.endsWith('weeks')) {
    const weeks = parseInt(lowerDate, 10);
    const d = new Date();
    d.setDate(d.getDate() - (weeks * 7));
    return formatDate(d);
  }

  // Try to parse as date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return formatDate(date);
  }

  // Return as-is if already in Gmail format
  return dateStr;
}

/**
 * Format date as YYYY/MM/DD for Gmail query
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--from=')) {
      options.from = arg.slice(7).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--to=')) {
      options.to = arg.slice(5).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--subject=')) {
      options.subject = arg.slice(10).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--after=')) {
      options.after = arg.slice(8).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--before=')) {
      options.before = arg.slice(9).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--label=')) {
      options.label = arg.slice(8).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--max-results=')) {
      options.maxResults = parseInt(arg.slice(14), 10);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice(9);
    } else if (arg === '--unread') {
      options.unread = true;
    } else if (arg === '--starred') {
      options.starred = true;
    } else if (arg === '--has-attachment') {
      options.hasAttachment = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Gmail Search

Usage:
  node search.js "<query>"          Search with Gmail query syntax
  node search.js [options]          Search with structured options

Options:
  --from=<email>        Filter by sender
  --to=<email>          Filter by recipient
  --subject=<text>      Filter by subject
  --after=<date>        Messages after date (YYYY-MM-DD, "today", "7d", "2w")
  --before=<date>       Messages before date
  --label=<name>        Filter by label
  --unread              Only unread messages
  --starred             Only starred messages
  --has-attachment      Only messages with attachments
  --max-results=<n>     Maximum results (default: 20)
  --format=<type>       Output format: text (default) or json
  --help, -h            Show this help

Gmail Query Syntax:
  from:<email>          Messages from sender
  to:<email>            Messages to recipient
  subject:<text>        Subject contains text
  is:unread             Unread messages
  is:starred            Starred messages
  has:attachment        Has attachments
  after:YYYY/MM/DD      After date
  before:YYYY/MM/DD     Before date
  label:<name>          Has label
  larger:5M             Larger than 5MB
  filename:pdf          Has PDF attachment

Examples:
  node search.js "from:boss is:unread"
  node search.js --from="john" --after="7d"
  node search.js --unread --has-attachment
  node search.js "subject:invoice after:2024/01/01"
`);
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      // Treat non-flag argument as query
      options.query = arg;
    }
  }

  return options;
}

// Run
const options = parseArgs();
searchMessages(options);
