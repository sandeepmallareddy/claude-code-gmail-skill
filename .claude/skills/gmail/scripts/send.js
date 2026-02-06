#!/usr/bin/env node

/**
 * Send Gmail Message
 *
 * Usage:
 *   node send.js --to="email@example.com" --subject="Hello" --body="Message"
 *   node send.js --to="email" --subject="Re: ..." --body="..." --reply-to=<message-id>
 *   node send.js --draft                    # Save as draft instead of sending
 */

import { getGmailClient, handleApiError } from './lib/gmail.js';
import { getHeader } from './lib/formatter.js';

async function sendMessage(options = {}) {
  const {
    to,
    cc,
    bcc,
    subject,
    body,
    replyTo,
    isDraft = false
  } = options;

  if (!to) {
    console.error('Error: --to is required');
    process.exit(1);
  }

  if (!subject && !replyTo) {
    console.error('Error: --subject is required (unless replying)');
    process.exit(1);
  }

  if (!body) {
    console.error('Error: --body is required');
    process.exit(1);
  }

  try {
    const gmail = await getGmailClient();

    let finalSubject = subject;
    let threadId = null;
    let references = '';
    let inReplyTo = '';

    // If replying, get original message details
    if (replyTo) {
      const originalMessage = await gmail.users.messages.get({
        userId: 'me',
        id: replyTo,
        format: 'metadata',
        metadataHeaders: ['Subject', 'Message-ID', 'References']
      });

      const headers = originalMessage.data.payload.headers;
      const originalSubject = getHeader(headers, 'Subject') || '';
      const originalMessageId = getHeader(headers, 'Message-ID');
      const originalReferences = getHeader(headers, 'References') || '';

      // Set subject if not provided
      if (!subject) {
        finalSubject = originalSubject.startsWith('Re:')
          ? originalSubject
          : `Re: ${originalSubject}`;
      }

      threadId = originalMessage.data.threadId;
      inReplyTo = originalMessageId;
      references = originalReferences
        ? `${originalReferences} ${originalMessageId}`
        : originalMessageId;
    }

    // Build RFC 2822 email message
    const messageParts = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : null,
      bcc ? `Bcc: ${bcc}` : null,
      `Subject: ${finalSubject}`,
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
      references ? `References: ${references}` : null,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      body
    ].filter(Boolean);

    const rawMessage = Buffer.from(messageParts.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (isDraft) {
      // Create draft
      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: rawMessage,
            threadId
          }
        }
      });

      console.log('✓ Draft created successfully!');
      console.log(`  Draft ID: ${response.data.id}`);
      console.log(`  Message ID: ${response.data.message.id}`);
    } else {
      // Send message
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
          threadId
        }
      });

      console.log('✓ Email sent successfully!');
      console.log(`  Message ID: ${response.data.id}`);
      console.log(`  Thread ID: ${response.data.threadId}`);
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${finalSubject}`);
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

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--to=')) {
      options.to = arg.slice(5).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--cc=')) {
      options.cc = arg.slice(5).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--bcc=')) {
      options.bcc = arg.slice(6).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--subject=')) {
      options.subject = arg.slice(10).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--body=')) {
      options.body = arg.slice(7).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--reply-to=')) {
      options.replyTo = arg.slice(11);
    } else if (arg === '--draft') {
      options.isDraft = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Gmail Send Message

Usage:
  node send.js --to="<email>" --subject="<subject>" --body="<message>"

Options:
  --to=<email>          Recipient email address (required)
  --cc=<email>          CC recipient(s)
  --bcc=<email>         BCC recipient(s)
  --subject=<text>      Email subject (required unless replying)
  --body=<text>         Email body content (required)
  --reply-to=<id>       Message ID to reply to (sets thread and References)
  --draft               Save as draft instead of sending
  --help, -h            Show this help

Examples:
  # Send a new email
  node send.js --to="john@example.com" --subject="Hello" --body="Hi John!"

  # Reply to a message
  node send.js --to="john@example.com" --reply-to=18abc123 --body="Thanks!"

  # Save as draft
  node send.js --to="john@example.com" --subject="Draft" --body="..." --draft

  # Send with CC
  node send.js --to="john@example.com" --cc="boss@example.com" --subject="Update" --body="..."
`);
      process.exit(0);
    }
  }

  return options;
}

// Run
const options = parseArgs();
sendMessage(options);
