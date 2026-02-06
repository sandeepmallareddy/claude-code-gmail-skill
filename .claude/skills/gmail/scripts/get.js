#!/usr/bin/env node

/**
 * Get Gmail Message Content
 *
 * Usage:
 *   node get.js --id=<message-id>           # Get full message
 *   node get.js --id=<id> --format=json     # Output as JSON
 *   node get.js --thread=<thread-id>        # Get entire thread
 */

import { getGmailClient, handleApiError } from './lib/gmail.js';
import { formatFullEmail, formatMessageSummary, getHeader, extractBody } from './lib/formatter.js';

async function getMessage(options = {}) {
  const { id, threadId, format = 'text', includeAttachments = false } = options;

  if (!id && !threadId) {
    console.error('Error: Please provide --id=<message-id> or --thread=<thread-id>');
    process.exit(1);
  }

  try {
    const gmail = await getGmailClient();

    if (threadId) {
      // Get entire thread
      const threadResponse = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      const thread = threadResponse.data;
      const messages = thread.messages || [];

      if (format === 'json') {
        console.log(JSON.stringify({
          threadId: thread.id,
          messageCount: messages.length,
          messages: messages.map(formatMessageData)
        }, null, 2));
      } else {
        console.log(`Thread: ${thread.id} (${messages.length} messages)\n`);
        console.log('='.repeat(60) + '\n');

        for (let i = 0; i < messages.length; i++) {
          console.log(`--- Message ${i + 1} of ${messages.length} ---\n`);
          console.log(formatFullEmail(messages[i]));
          console.log('\n');
        }
      }
    } else {
      // Get single message
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: id,
        format: 'full'
      });

      const message = messageResponse.data;

      if (format === 'json') {
        console.log(JSON.stringify(formatMessageData(message), null, 2));
      } else {
        console.log(formatFullEmail(message));

        // Show attachment info if present
        const attachments = getAttachments(message.payload);
        if (attachments.length > 0) {
          console.log('\n\n**Attachments:**');
          attachments.forEach((att, i) => {
            console.log(`  ${i + 1}. ${att.filename} (${att.mimeType}, ${formatSize(att.size)})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', handleApiError(error));
    process.exit(1);
  }
}

/**
 * Format message data for JSON output
 */
function formatMessageData(message) {
  const headers = message.payload?.headers || [];

  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds,
    headers: {
      subject: getHeader(headers, 'Subject'),
      from: getHeader(headers, 'From'),
      to: getHeader(headers, 'To'),
      cc: getHeader(headers, 'Cc'),
      date: getHeader(headers, 'Date'),
      messageId: getHeader(headers, 'Message-ID'),
      inReplyTo: getHeader(headers, 'In-Reply-To')
    },
    snippet: message.snippet,
    body: extractBody(message.payload),
    attachments: getAttachments(message.payload)
  };
}

/**
 * Extract attachment info from message payload
 */
function getAttachments(payload, attachments = []) {
  if (!payload) return attachments;

  if (payload.filename && payload.body?.attachmentId) {
    attachments.push({
      id: payload.body.attachmentId,
      filename: payload.filename,
      mimeType: payload.mimeType,
      size: payload.body.size || 0
    });
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      getAttachments(part, attachments);
    }
  }

  return attachments;
}

/**
 * Format bytes to human readable
 */
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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--id=')) {
      options.id = arg.slice(5);
    } else if (arg.startsWith('--thread=')) {
      options.threadId = arg.slice(9);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice(9);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Gmail Get Message

Usage:
  node get.js --id=<message-id>     Get a single message
  node get.js --thread=<thread-id>  Get all messages in a thread

Options:
  --id=<id>           Message ID to retrieve
  --thread=<id>       Thread ID to retrieve all messages
  --format=<type>     Output format: text (default) or json
  --help, -h          Show this help

Examples:
  node get.js --id=18abc123def           # Get message by ID
  node get.js --thread=18abc123def       # Get entire thread
  node get.js --id=18abc --format=json   # Output as JSON
`);
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      // Treat non-flag argument as message ID
      options.id = arg;
    }
  }

  return options;
}

// Run
const options = parseArgs();
getMessage(options);
