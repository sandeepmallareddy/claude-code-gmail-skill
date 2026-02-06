import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TOKEN_PATH = path.join(os.homedir(), '.config', 'claude-gmail', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Creates an authenticated Gmail API client
 * @returns {Promise<import('googleapis').gmail_v1.Gmail>} Gmail API client
 */
export async function getGmailClient() {
  const auth = await getAuthClient();
  return google.gmail({ version: 'v1', auth });
}

/**
 * Gets or creates an authenticated OAuth2 client
 * @returns {Promise<import('googleapis').Auth.OAuth2Client>} Authenticated OAuth2 client
 */
export async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'credentials.json not found. Please download OAuth credentials from Google Cloud Console.\n' +
      'See README.md for setup instructions.'
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      'Not authenticated. Please run: npm run auth\n' +
      'This will open a browser window to authorize Gmail access.'
    );
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oAuth2Client.setCredentials(token);

  // Check if token needs refresh
  if (isTokenExpired(token)) {
    try {
      const { credentials: newToken } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(newToken);
      saveToken(newToken);
    } catch (error) {
      throw new Error(
        'Token expired and refresh failed. Please re-authenticate: npm run auth'
      );
    }
  }

  return oAuth2Client;
}

/**
 * Check if the access token is expired or about to expire
 * @param {object} token - The token object
 * @returns {boolean} True if token is expired or expires within 5 minutes
 */
function isTokenExpired(token) {
  if (!token.expiry_date) return false;
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
  return Date.now() >= token.expiry_date - bufferMs;
}

/**
 * Save token to disk
 * @param {object} token - The token object to save
 */
export function saveToken(token) {
  const tokenDir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), { mode: 0o600 });
}

/**
 * Get the token file path
 * @returns {string} Path to token file
 */
export function getTokenPath() {
  return TOKEN_PATH;
}

/**
 * Get the credentials file path
 * @returns {string} Path to credentials file
 */
export function getCredentialsPath() {
  return CREDENTIALS_PATH;
}

/**
 * Handle Gmail API errors with user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function handleApiError(error) {
  if (error.code === 401) {
    return 'Authentication expired. Please run: npm run auth';
  }
  if (error.code === 403) {
    return 'Permission denied. Check that the required Gmail scopes are authorized.';
  }
  if (error.code === 404) {
    return 'Message not found. It may have been deleted.';
  }
  if (error.code === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  return error.message || 'An unknown error occurred';
}
