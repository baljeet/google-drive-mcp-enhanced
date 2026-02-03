# Setup Guide

This guide walks you through setting up the Google Drive MCP Enhanced server.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Google account
- Access to Google Cloud Console

## Step 1: Google Cloud Project Setup

### Create a New Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Google Drive MCP")
5. Click "Create"

### Enable Required APIs

1. In your project, go to **APIs & Services > Library**
2. Search for and enable each of these APIs:
   - **Google Drive API**
   - **Google Docs API**
   - **Google Sheets API**

## Step 2: OAuth 2.0 Credentials

### Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: "Google Drive MCP Enhanced"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. On the Scopes page, click "Add or Remove Scopes"
6. Add these scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/spreadsheets`
7. Click "Save and Continue"
8. Add your email as a test user
9. Click "Save and Continue"

### Create OAuth 2.0 Client ID

1. Go to **APIs & Services > Credentials**
2. Click **+ Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Desktop app**
4. Name: "Google Drive MCP Client"
5. Click "Create"
6. You'll see a dialog with your Client ID and Client Secret
7. Click "Download JSON" or copy the values

## Step 3: Install the Server

```bash
# Clone or navigate to the project directory
cd google-drive-mcp-enhanced

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 4: Configure Environment Variables

### Option 1: Environment Variables

```bash
export GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

### Option 2: .env File (Not Recommended for Production)

Create a `.env` file in the project root:

```
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Note**: Never commit this file to version control!

## Step 5: Configure MCP Client

### For Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the server configuration:

```json
{
  "mcpServers": {
    "google-drive-enhanced": {
      "command": "node",
      "args": ["/absolute/path/to/google-drive-mcp-enhanced/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id-here.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret-here"
      }
    }
  }
}
```

Replace `/absolute/path/to/google-drive-mcp-enhanced` with the actual path to your installation.

### For Other MCP Clients

Refer to your MCP client's documentation for how to configure servers. The general pattern is:

```json
{
  "command": "node",
  "args": ["path/to/dist/index.js"],
  "env": {
    "GOOGLE_CLIENT_ID": "...",
    "GOOGLE_CLIENT_SECRET": "..."
  }
}
```

## Step 6: First Run Authentication

1. Restart your MCP client (e.g., Claude Desktop)
2. The server will automatically start when needed
3. On first use, a browser window will open
4. Sign in to your Google account
5. Review and accept the requested permissions
6. You'll see a success message - you can close the browser window
7. The server is now authenticated and ready to use

### Token Storage

Tokens are stored securely at:
- **Linux/macOS**: `~/.local/share/google-drive-mcp/tokens.json`
- **Windows**: `%LOCALAPPDATA%/google-drive-mcp/tokens.json`

The file has restricted permissions (0600) for security.

## Verification

Test that the server is working by asking your MCP client to:

```
Search for files in my Google Drive
```

If you see results, the server is configured correctly!

## Troubleshooting

### "Invalid client" Error

- Verify your Client ID and Client Secret are correct
- Ensure there are no extra spaces or quotes
- Check that you're using the Desktop app credentials (not Web application)

### "Access denied" Error

- Make sure all required APIs are enabled in Google Cloud Console
- Check that your OAuth consent screen is configured correctly
- Verify the scopes were added to the consent screen

### Browser Doesn't Open

If the browser doesn't open automatically:
1. Look in the terminal/logs for the authentication URL
2. Manually copy and paste it into your browser
3. Complete the authentication flow

### "Token expired" Error

- Delete the tokens file: `rm ~/.local/share/google-drive-mcp/tokens.json`
- Restart the MCP client to re-authenticate

### Permission Issues on Token File

```bash
# Fix permissions on Linux/macOS
chmod 600 ~/.local/share/google-drive-mcp/tokens.json
```

## Advanced Configuration

### Custom Token Storage Location

Set the `XDG_DATA_HOME` environment variable to change where tokens are stored:

```bash
export XDG_DATA_HOME=/custom/path
```

Tokens will be stored at: `/custom/path/google-drive-mcp/tokens.json`

### Running Multiple Instances

To run multiple instances with different Google accounts:
1. Use different environment variable sets
2. Set different `XDG_DATA_HOME` values for each instance
3. Configure separate entries in your MCP client config

## Security Best Practices

1. **Never commit credentials** - Add `.env` to `.gitignore`
2. **Restrict token file permissions** - Already done automatically (0600)
3. **Use service accounts** - For production deployments, consider using service accounts
4. **Regular token rotation** - Delete and re-authenticate periodically
5. **Minimal scopes** - Only request the scopes you need

## Next Steps

- Read [EXAMPLES.md](EXAMPLES.md) for usage examples
- Review the [README.md](../README.md) for available tools
- Start using the server with your MCP client!

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review the server logs in your MCP client
3. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)
