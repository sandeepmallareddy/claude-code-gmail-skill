#!/usr/bin/env node

/**
 * Gmail OAuth2 Authentication Script
 *
 * Usage: node auth.js
 *
 * This script initiates the OAuth2 flow to authorize Gmail access.
 * It opens a browser window for user consent and stores the tokens locally.
 */

import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import crypto from 'node:crypto';

// OAuth scopes - request minimal necessary permissions
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',   // Read emails
  'https://www.googleapis.com/auth/gmail.send',       // Send emails
  'https://www.googleapis.com/auth/gmail.modify',     // Modify labels, archive
];

const TOKEN_DIR = path.join(os.homedir(), '.config', 'claude-gmail');
const TOKEN_PATH = path.join(TOKEN_DIR, 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const REDIRECT_PORT = 3000;

// Generate secure random state for CSRF protection
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

async function authenticate() {
  console.log('Gmail Authentication for Claude Code\n');

  // Check for credentials.json
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('Error: credentials.json not found in current directory.');
    console.error('\nTo set up Gmail API credentials:');
    console.error('1. Go to https://console.cloud.google.com/');
    console.error('2. Create a new project or select existing');
    console.error('3. Enable the Gmail API');
    console.error('4. Create OAuth 2.0 credentials (Desktop application)');
    console.error('5. Download as credentials.json to this directory');
    console.error('\nSee README.md for detailed instructions.');
    process.exit(1);
  }

  // Load credentials
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${REDIRECT_PORT}/callback`
  );

  // Check for existing token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);

    // Verify token is still valid
    try {
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      await gmail.users.getProfile({ userId: 'me' });
      console.log('✓ Already authenticated!');
      console.log(`  Token stored at: ${TOKEN_PATH}`);

      // Show token info
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log(`  Email: ${profile.data.emailAddress}`);
      process.exit(0);
    } catch (error) {
      console.log('Existing token is invalid or expired. Re-authenticating...\n');
    }
  }

  // Generate CSRF state
  const state = generateState();

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // Always show consent to get refresh token
    state: state        // CSRF protection
  });

  console.log('Opening browser for authorization...\n');

  // Create local server to receive OAuth callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);

        if (url.pathname === '/callback') {
          const authCode = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const returnedState = url.searchParams.get('state');

          // Verify CSRF state
          if (returnedState !== state) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html><body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>❌ Authorization Failed</h1>
                <p>CSRF verification failed. Please try again.</p>
                <p>You can close this window.</p>
              </body></html>
            `);
            reject(new Error('CSRF verification failed'));
            server.close();
            return;
          }

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html><body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>❌ Authorization Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window.</p>
              </body></html>
            `);
            reject(new Error(`Authorization failed: ${error}`));
            server.close();
            return;
          }

          if (authCode) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html><body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>✓ Authorization Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body></html>
            `);
            resolve(authCode);
            server.close();
          }
        }
      } catch (err) {
        reject(err);
        server.close();
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`Listening on http://localhost:${REDIRECT_PORT}`);
      console.log('Waiting for authorization...\n');

      // Open browser
      open(authUrl).catch(() => {
        console.log('Could not open browser automatically.');
        console.log('Please open this URL manually:\n');
        console.log(authUrl);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${REDIRECT_PORT} is already in use.`);
        console.error('Please close any other applications using this port.');
      }
      reject(err);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authorization timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });

  // Exchange code for tokens
  console.log('Exchanging authorization code for tokens...');
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Create token directory with secure permissions
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true, mode: 0o700 });
  }

  // Save tokens with secure permissions
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });

  console.log('\n✓ Authentication successful!');
  console.log(`  Token stored at: ${TOKEN_PATH}`);

  // Verify and show account info
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log(`  Email: ${profile.data.emailAddress}`);
  console.log(`  Messages: ${profile.data.messagesTotal}`);
  console.log(`  Threads: ${profile.data.threadsTotal}`);

  console.log('\nYou can now use the Gmail skill in Claude Code!');
}

// Run authentication
authenticate().catch((error) => {
  console.error('\nAuthentication failed:', error.message);
  process.exit(1);
});
