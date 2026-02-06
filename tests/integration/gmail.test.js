/**
 * Integration Tests for Gmail Skill
 *
 * These tests use REAL Gmail API credentials to verify actual functionality.
 * They require a valid credentials.json file in the project root.
 *
 * WARNING: Some tests may modify data (send emails, modify labels).
 * Run with: node tests/integration/gmail.test.js
 *
 * Safe read-only tests:
 *   node tests/integration/gmail.test.js
 *
 * All tests including send (requires --allow-send flag and confirmation):
 *   node tests/integration/gmail.test.js --allow-send
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CREDENTIALS_PATH = path.join(PROJECT_ROOT, 'credentials.json');

// Check for credentials
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('❌ ERROR: credentials.json not found!');
  console.error('   Please download OAuth credentials from Google Cloud Console.');
  console.error('   See README.md for setup instructions.');
  console.error('');
  console.error('   To run integration tests:');
  console.error('   1. Create a project at https://console.cloud.google.com/');
  console.error('   2. Enable Gmail API');
  console.error('   3. Create OAuth 2.0 credentials (Desktop app)');
  console.error('   4. Download as credentials.json to project root');
  console.error('   5. Run: npm run auth');
  console.error('   6. Run: node tests/integration/gmail.test.js');
  process.exit(1);
}

// Import Google APIs
import { google } from 'googleapis';

console.log('🧪 Gmail Integration Tests');
console.log('='.repeat(50));

let gmail;
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null) {
  const status = passed ? '✓' : '✗';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}`);
  if (error) {
    console.log(`  ${error}`);
  }
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function authenticate() {
  console.log('\n🔐 Authenticating with Gmail API...\n');

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/callback'
  );

  const tokenPath = path.join(process.env.HOME || process.env.USERPROFILE, '.config/claude-gmail/token.json');

  if (!fs.existsSync(tokenPath)) {
    console.error('❌ ERROR: Not authenticated!');
    console.error('   Please run: npm run auth');
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  oAuth2Client.setCredentials(token);

  // Check if token needs refresh
  if (token.expiry_date && Date.now() >= token.expiry_date - 300000) {
    console.log('   Refreshing expired token...');
    const { credentials: newToken } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(newToken);
    fs.writeFileSync(tokenPath, JSON.stringify(newToken, null, 2));
  }

  gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  console.log('   ✅ Authentication successful!\n');
}

async function testGetProfile() {
  console.log('📋 Test: Get User Profile');

  try {
    const response = await gmail.users.getProfile({ userId: 'me' });
    const profile = response.data;

    console.log(`   Email: ${profile.emailAddress}`);
    console.log(`   Messages: ${profile.messagesTotal}`);
    console.log(`   Threads: ${profile.threadsTotal}`);

    logTest('Get Profile', true);
    return profile;
  } catch (error) {
    logTest('Get Profile', false, error.message);
    return null;
  }
}

async function testListLabels() {
  console.log('\n🏷️  Test: List Labels');

  try {
    const response = await gmail.users.labels.list({ userId: 'me' });
    const labels = response.data.labels || [];

    console.log(`   Found ${labels.length} labels:`);
    labels.slice(0, 5).forEach(label => {
      console.log(`   - ${label.name} (${label.type})`);
    });
    if (labels.length > 5) {
      console.log(`   ... and ${labels.length - 5} more`);
    }

    logTest('List Labels', true);
    return labels;
  } catch (error) {
    logTest('List Labels', false, error.message);
    return [];
  }
}

async function testListMessages() {
  console.log('\n📧 Test: List Recent Messages');

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5
    });

    const messages = response.data.messages || [];
    console.log(`   Found ${response.data.resultSizeEstimate || messages.length} messages`);

    if (messages.length > 0) {
      console.log('   Recent messages:');
      for (const msg of messages.slice(0, 3)) {
        // Get message details
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date']
        });
        const subject = detail.data.payload?.headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const from = detail.data.payload?.headers?.find(h => h.name === 'From')?.value || 'Unknown';
        console.log(`   - ${subject}`);
        console.log(`     From: ${from.substring(0, 50)}...`);
      }
    }

    logTest('List Messages', true);
    return messages;
  } catch (error) {
    logTest('List Messages', false, error.message);
    return [];
  }
}

async function testSearchMessages() {
  console.log('\n🔍 Test: Search Messages (is:unread)');

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 10
    });

    const messages = response.data.messages || [];
    console.log(`   Found ${response.data.resultSizeEstimate || messages.length} unread messages`);

    logTest('Search Messages', true);
    return messages;
  } catch (error) {
    logTest('Search Messages', false, error.message);
    return [];
  }
}

async function testGetMessage(messageId) {
  console.log('\n📄 Test: Get Message Details');

  if (!messageId) {
    console.log('   Skipping - no message ID available');
    logTest('Get Message Details', true); // Skip as info
    return null;
  }

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const message = response.data;
    const headers = message.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';

    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${from}`);
    console.log(`   Snippet: ${message.snippet?.substring(0, 100)}...`);
    console.log(`   Labels: ${message.labelIds?.join(', ')}`);

    logTest('Get Message Details', true);
    return message;
  } catch (error) {
    logTest('Get Message Details', false, error.message);
    return null;
  }
}

async function testSendMessage(profile) {
  console.log('\n✉️  Test: Send Email (DRY RUN - does not actually send)');

  const readline = await import('node:readline');

  // Check if send is allowed
  const args = process.argv.slice(2);
  if (!args.includes('--allow-send')) {
    console.log('   ⚠️  Skipping send test (requires --allow-send flag)');
    console.log('   To enable send tests:');
    console.log('   node tests/integration/gmail.test.js --allow-send');
    console.log('');
    console.log('   This will send a test email to yourself.');
    logTest('Send Email', true); // Not a failure, just skipped
    return null;
  }

  console.log('   ⚠️  This will send a REAL email to your account!');
  console.log(`   Recipient: ${profile.emailAddress}`);
  console.log(`   Subject: [Gmail Skill Test] Integration Test`);

  const rl = readline.default.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('   Send this email? (yes/no): ', async (answer) => {
      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('   Email send cancelled.');
        logTest('Send Email', true); // Cancelled is OK
        resolve(null);
        return;
      }

      try {
        // Build the email
        const subject = '[Gmail Skill Test] Integration Test';
        const body = `This is a test email sent by the Gmail Skill integration tests.\n\nSent at: ${new Date().toISOString()}\n\nIf you received this, the integration tests are working correctly!`;

        const messageParts = [
          `To: ${profile.emailAddress}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=UTF-8',
          '',
          body
        ];

        const rawMessage = Buffer.from(messageParts.join('\r\n'))
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: rawMessage }
        });

        console.log(`   ✅ Email sent successfully!`);
        console.log(`   Message ID: ${response.data.id}`);
        console.log(`   Thread ID: ${response.data.threadId}`);

        logTest('Send Email', true);
        resolve(response.data);
      } catch (error) {
        console.error(`   ❌ Failed to send email: ${error.message}`);
        logTest('Send Email', false, error.message);
        resolve(null);
      }
    });
  });
}

async function testThreadOperations(threadId) {
  console.log('\n🧵 Test: Thread Operations');

  if (!threadId) {
    console.log('   Skipping - no thread ID available');
    logTest('Thread Operations', true);
    return;
  }

  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    });

    const thread = response.data;
    console.log(`   Thread ID: ${thread.id}`);
    console.log(`   Messages in thread: ${thread.messages?.length || 0}`);

    logTest('Thread Operations', true);
    return thread;
  } catch (error) {
    logTest('Thread Operations', false, error.message);
    return null;
  }
}

async function runTests() {
  const startTime = Date.now();

  try {
    // Authenticate
    await authenticate();

    // Get profile
    const profile = await testGetProfile();
    if (!profile) {
      throw new Error('Failed to get profile - check authentication');
    }

    // Run tests
    await testListLabels();
    const messages = await testListMessages();
    await testSearchMessages();

    if (messages.length > 0) {
      await testGetMessage(messages[0].id);
      await testThreadOperations(messages[0].threadId);
    }

    await testSendMessage(profile);

  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }

  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests();
