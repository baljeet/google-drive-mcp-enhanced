import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { TokenData } from '../types/google-drive.js';

export class TokenManager {
  private tokenPath: string;

  constructor() {
    // Use XDG Base Directory spec for token storage
    const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
    const tokenDir = path.join(xdgDataHome, 'google-drive-mcp');
    this.tokenPath = path.join(tokenDir, 'tokens.json');
  }

  async ensureTokenDirectory(): Promise<void> {
    const tokenDir = path.dirname(this.tokenPath);
    try {
      await fs.mkdir(tokenDir, { recursive: true, mode: 0o700 });
    } catch (error) {
      console.error('Failed to create token directory:', error);
      throw error;
    }
  }

  async saveTokens(tokens: TokenData): Promise<void> {
    await this.ensureTokenDirectory();
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2), {
      mode: 0o600, // Only owner can read/write
    });
  }

  async loadTokens(): Promise<TokenData | null> {
    try {
      const data = await fs.readFile(this.tokenPath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async deleteTokens(): Promise<void> {
    try {
      await fs.unlink(this.tokenPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async hasValidTokens(): Promise<boolean> {
    const tokens = await this.loadTokens();
    if (!tokens) {
      return false;
    }

    // Check if token has expired
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      return !!tokens.refresh_token; // Valid if we have a refresh token
    }

    return true;
  }
}
