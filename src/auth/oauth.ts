import { google } from 'googleapis';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import http from 'http';
import { URL } from 'url';
import open from 'open';
import crypto from 'crypto';
import { TokenManager } from './token-manager.js';
import { TokenData } from '../types/google-drive.js';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
];

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

export class GoogleAuthManager {
  private oauth2Client: OAuth2Client;
  private tokenManager: TokenManager;

  constructor(clientId?: string, clientSecret?: string) {
    // Allow custom credentials or use defaults (user must provide their own)
    const id = clientId || process.env.GOOGLE_CLIENT_ID || '';
    const secret = clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';

    if (!id || !secret) {
      throw new Error(
        'Google OAuth credentials not found. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables or pass them to the constructor.'
      );
    }

    this.oauth2Client = new google.auth.OAuth2(id, secret, REDIRECT_URI);
    this.tokenManager = new TokenManager();
  }

  async authenticate(): Promise<OAuth2Client> {
    // Try to load existing tokens
    const tokens = await this.tokenManager.loadTokens();

    if (tokens) {
      this.oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      });

      // Set up automatic token refresh
      this.oauth2Client.on('tokens', async (newTokens) => {
        if (newTokens.refresh_token) {
          await this.tokenManager.saveTokens({
            access_token: newTokens.access_token!,
            refresh_token: newTokens.refresh_token,
            scope: newTokens.scope!,
            token_type: newTokens.token_type!,
            expiry_date: newTokens.expiry_date!,
          });
        }
      });

      return this.oauth2Client;
    }

    // No tokens found, perform OAuth flow
    return await this.performOAuthFlow();
  }

  private async performOAuthFlow(): Promise<OAuth2Client> {
    return new Promise((resolve, reject) => {
      // Generate PKCE verifier
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Create auth URL
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256' as CodeChallengeMethod,
        prompt: 'consent', // Force consent to get refresh token
      });

      console.error('\n🔐 Authentication Required');
      console.error('Opening browser for Google OAuth...');
      console.error('If the browser does not open, visit this URL:');
      console.error(authUrl);
      console.error('');

      // Open browser
      open(authUrl).catch(() => {
        console.error('Failed to open browser automatically.');
      });

      // Create local server to receive callback
      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url!, `http://localhost:3000`);

          if (url.pathname === '/oauth2callback') {
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');

            if (error) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
              server.close();
              reject(new Error(`OAuth error: ${error}`));
              return;
            }

            if (!code) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('<h1>No authorization code received</h1>');
              server.close();
              reject(new Error('No authorization code received'));
              return;
            }

            // Exchange code for tokens
            const { tokens } = await this.oauth2Client.getToken({
              code: code as string,
              codeVerifier,
            });

            this.oauth2Client.setCredentials(tokens);

            // Save tokens
            await this.tokenManager.saveTokens({
              access_token: tokens.access_token!,
              refresh_token: tokens.refresh_token || undefined,
              scope: tokens.scope!,
              token_type: tokens.token_type!,
              expiry_date: tokens.expiry_date!,
            });

            // Set up automatic token refresh
            this.oauth2Client.on('tokens', async (newTokens) => {
              if (newTokens.refresh_token) {
                await this.tokenManager.saveTokens({
                  access_token: newTokens.access_token!,
                  refresh_token: newTokens.refresh_token,
                  scope: newTokens.scope!,
                  token_type: newTokens.token_type!,
                  expiry_date: newTokens.expiry_date!,
                });
              }
            });

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>✅ Authentication Successful!</h1><p>You can close this window and return to the terminal.</p>');

            server.close();
            console.error('✅ Authentication successful!\n');
            resolve(this.oauth2Client);
          }
        } catch (error) {
          console.error('Error in OAuth callback:', error);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Error</h1><p>An error occurred during authentication.</p>');
          server.close();
          reject(error);
        }
      });

      server.listen(3000, () => {
        console.error('Waiting for authentication...\n');
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timeout'));
      }, 5 * 60 * 1000);
    });
  }

  getClient(): OAuth2Client {
    return this.oauth2Client;
  }
}
