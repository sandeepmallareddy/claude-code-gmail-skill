#!/usr/bin/env node

/**
 * Modify Gmail Messages (labels, archive, star, trash)
 *
 * Usage:
 *   node modify.js --id=<message-id> --archive
 *   node modify.js --id=<id> --star
 *   node modify.js --id=<id> --add-label="Important"
 *   node modify.js --id=<id> --trash
 */

import { getGmailClient, handleApiError } from './lib/gmail.js';

async function modifyMessage(options = {}) {
  const {
    id,
    archive,
    unarchive,
    star,
    unstar,
    markRead,
    markUnread,
    trash,
    untrash,
    addLabel,
    removeLabel,
    listLabels
  } = options;

  try {
    const gmail = await getGmailClient();

    // List all labels
    if (listLabels) {
      const response = await gmail.users.labels.list({ userId: 'me' });
      const labels = response.data.labels || [];

      console.log('Available Labels:\n');

      // Group by type
      const system = labels.filter(l => l.type === 'system');
      const user = labels.filter(l => l.type === 'user');

      console.log('System Labels:');
      system.forEach(l => console.log(`  - ${l.name} (${l.id})`));

      console.log('\nUser Labels:');
      if (user.length > 0) {
        user.forEach(l => console.log(`  - ${l.name} (${l.id})`));
      } else {
        console.log('  (none)');
      }

      return;
    }

    // Require message ID for modifications
    if (!id) {
      console.error('Error: --id=<message-id> is required');
      process.exit(1);
    }

    // Build label modifications
    const addLabelIds = [];
    const removeLabelIds = [];

    if (archive) {
      removeLabelIds.push('INBOX');
    }
    if (unarchive) {
      addLabelIds.push('INBOX');
    }
    if (star) {
      addLabelIds.push('STARRED');
    }
    if (unstar) {
      removeLabelIds.push('STARRED');
    }
    if (markRead) {
      removeLabelIds.push('UNREAD');
    }
    if (markUnread) {
      addLabelIds.push('UNREAD');
    }

    // Handle custom labels
    if (addLabel) {
      const labelId = await resolveLabelId(gmail, addLabel);
      if (labelId) {
        addLabelIds.push(labelId);
      } else {
        console.error(`Label not found: "${addLabel}"`);
        console.error('Use --list-labels to see available labels');
        process.exit(1);
      }
    }

    if (removeLabel) {
      const labelId = await resolveLabelId(gmail, removeLabel);
      if (labelId) {
        removeLabelIds.push(labelId);
      } else {
        console.error(`Label not found: "${removeLabel}"`);
        process.exit(1);
      }
    }

    // Handle trash operations
    if (trash) {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: id
      });
      console.log('✓ Message moved to trash');
      console.log(`  Message ID: ${response.data.id}`);
      return;
    }

    if (untrash) {
      const response = await gmail.users.messages.untrash({
        userId: 'me',
        id: id
      });
      console.log('✓ Message restored from trash');
      console.log(`  Message ID: ${response.data.id}`);
      return;
    }

    // Apply label modifications
    if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
      console.error('Error: No modifications specified');
      console.error('Use --archive, --star, --mark-read, --add-label, etc.');
      process.exit(1);
    }

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: id,
      requestBody: {
        addLabelIds: addLabelIds.length > 0 ? addLabelIds : undefined,
        removeLabelIds: removeLabelIds.length > 0 ? removeLabelIds : undefined
      }
    });

    console.log('✓ Message modified successfully');
    console.log(`  Message ID: ${response.data.id}`);

    if (addLabelIds.length > 0) {
      console.log(`  Added labels: ${addLabelIds.join(', ')}`);
    }
    if (removeLabelIds.length > 0) {
      console.log(`  Removed labels: ${removeLabelIds.join(', ')}`);
    }

  } catch (error) {
    console.error('Error:', handleApiError(error));
    process.exit(1);
  }
}

/**
 * Resolve a label name to its ID
 * @param {object} gmail - Gmail API client
 * @param {string} labelName - Label name or ID
 * @returns {Promise<string|null>} Label ID or null if not found
 */
async function resolveLabelId(gmail, labelName) {
  // Check if it's already an ID (system labels)
  const systemLabels = ['INBOX', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT',
    'SENT', 'DRAFT', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL',
    'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'];

  if (systemLabels.includes(labelName.toUpperCase())) {
    return labelName.toUpperCase();
  }

  // Look up user labels
  const response = await gmail.users.labels.list({ userId: 'me' });
  const labels = response.data.labels || [];

  const found = labels.find(l =>
    l.name.toLowerCase() === labelName.toLowerCase() ||
    l.id === labelName
  );

  return found?.id || null;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--id=')) {
      options.id = arg.slice(5);
    } else if (arg === '--archive') {
      options.archive = true;
    } else if (arg === '--unarchive') {
      options.unarchive = true;
    } else if (arg === '--star') {
      options.star = true;
    } else if (arg === '--unstar') {
      options.unstar = true;
    } else if (arg === '--mark-read') {
      options.markRead = true;
    } else if (arg === '--mark-unread') {
      options.markUnread = true;
    } else if (arg === '--trash') {
      options.trash = true;
    } else if (arg === '--untrash') {
      options.untrash = true;
    } else if (arg.startsWith('--add-label=')) {
      options.addLabel = arg.slice(12).replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--remove-label=')) {
      options.removeLabel = arg.slice(15).replace(/^["']|["']$/g, '');
    } else if (arg === '--list-labels') {
      options.listLabels = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Gmail Modify Message

Usage:
  node modify.js --id=<message-id> [actions]
  node modify.js --list-labels

Actions:
  --archive             Remove from inbox (archive)
  --unarchive           Add back to inbox
  --star                Star the message
  --unstar              Remove star
  --mark-read           Mark as read
  --mark-unread         Mark as unread
  --trash               Move to trash
  --untrash             Restore from trash
  --add-label=<name>    Add a label
  --remove-label=<name> Remove a label

Other Options:
  --list-labels         Show all available labels
  --help, -h            Show this help

Examples:
  node modify.js --id=18abc123 --archive
  node modify.js --id=18abc123 --star --mark-read
  node modify.js --id=18abc123 --add-label="Work"
  node modify.js --id=18abc123 --trash
  node modify.js --list-labels
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
modifyMessage(options);
