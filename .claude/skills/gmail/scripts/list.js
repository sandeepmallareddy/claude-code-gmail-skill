#!/usr/bin/env node

/**
 * List Gmail Messages
 *
 * Usage:
 *   node list.js                           # List recent messages
 *   node list.js --query="is:unread"       # List unread messages
 *   node list.js --max-results=10          # Limit results
 *   node list.js --format=json             # Output as JSON
 */

import { getGmailClient, handleApiError } from './lib/gmail.js';
import { formatMessageSummary, formatMessageList } from './lib/formatter.js';

async function listMessages(options = {}) {
  const {
    query = '',
    maxResults = 20,
    format = 'text',
    pageToken = null
  } = options;

  try {
    const gmail = await getGmailClient();

    // List message IDs
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(maxResults, 100),
      pageToken
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      if (format === 'json') {
        console.log(JSON.stringify({ messages: [], total: 0 }));
      } else {
        console.log('No messages found.');
      }
      return;
    }

    // Fetch message details (metadata only for performance)
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
        messages: detailedMessages,
        total: listResponse.data.resultSizeEstimate || messages.length,
        nextPageToken: listResponse.data.nextPageToken
      }, null, 2));
    } else {
      console.log(`Found ${listResponse.data.resultSizeEstimate || messages.length} messages${query ? ` matching "${query}"` : ''}:\n`);
      console.log(formatMessageList(detailedMessages));

      if (listResponse.data.nextPageToken) {
        console.log(`\n(More results available. Use --page-token="${listResponse.data.nextPageToken}" to continue)`);
      }
    }

  } catch (error) {
    console.error('Error:', handleApiError(error));
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--query=')) {
      options.query = arg.slice(8).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--max-results=')) {
      options.maxResults = parseInt(arg.slice(14), 10);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice(9);
    } else if (arg.startsWith('--page-token=')) {
      options.pageToken = arg.slice(13);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Gmail List Messages

Usage:
  node list.js [options]

Options:
  --query="<query>"       Gmail search query (e.g., "is:unread", "from:john")
  --max-results=<n>       Maximum number of messages (default: 20, max: 100)
  --format=<type>         Output format: text (default) or json
  --page-token=<token>    Pagination token for next page
  --help, -h              Show this help

Examples:
  node list.js                              # List recent messages
  node list.js --query="is:unread"          # List unread messages
  node list.js --query="from:boss"          # Messages from boss
  node list.js --query="has:attachment"     # Messages with attachments
  node list.js --query="after:2024/01/01"   # Messages after a date

Gmail Query Syntax:
  is:unread, is:starred, is:important
  from:<email>, to:<email>, cc:<email>
  subject:<text>, has:attachment
  after:<date>, before:<date>
  label:<name>, in:inbox, in:sent
  larger:<size>, smaller:<size>
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
listMessages(options);
