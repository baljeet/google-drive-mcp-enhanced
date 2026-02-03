# Quick Start Guide

Get up and running with Google Drive MCP Enhanced in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A Google account
- Claude Desktop (or another MCP client)

## Step 1: Google Cloud Setup (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable these APIs (click "Enable API" for each):
   - Google Drive API
   - Google Docs API
   - Google Sheets API
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth 2.0 Client ID**
6. Choose **Desktop app**
7. Download or copy your Client ID and Client Secret

## Step 2: Install the Server (2 minutes)

```bash
# Navigate to the project directory
cd google-drive-mcp-enhanced

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 3: Configure Claude Desktop (2 minutes)

Edit Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/google-drive-mcp-enhanced/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET_HERE"
      }
    }
  }
}
```

**Important**: Replace `/ABSOLUTE/PATH/TO/` with your actual path!

## Step 4: First Run (1 minute)

1. Restart Claude Desktop
2. Ask Claude: "Search for files in my Google Drive"
3. A browser window will open for authentication
4. Sign in and grant permissions
5. Close the browser window when you see "Success"
6. You're done! 🎉

## Quick Test

Try these commands with Claude:

```
# Search for documents
Find all Google Docs in my Drive

# Add a comment
Create a Google Doc named "Test Doc"
Add a comment "This is a test" to that document

# Share a file
Share that document with someone@example.com as editor

# List comments
Show me all comments on that document
```

## Troubleshooting

### "No tools available"
- Check that the path in config is absolute (starts with `/` or `C:\`)
- Restart Claude Desktop after config changes

### "Authentication failed"
- Verify Client ID and Secret are correct
- Check for extra spaces or quotes in the values

### "APIs not enabled"
- Go to Google Cloud Console > APIs & Services > Library
- Search for and enable each required API

### Browser doesn't open
- Look in Claude Desktop logs for the auth URL
- Manually copy and paste it into your browser

## What's Next?

- Read [EXAMPLES.md](docs/EXAMPLES.md) for detailed usage examples
- Check [SETUP.md](docs/SETUP.md) for advanced configuration
- See [README.md](README.md) for all available tools

## Need Help?

- Check the troubleshooting section above
- Review the full documentation in docs/
- Open an issue on GitHub with your error message

## Most Common Use Cases

### 1. Collaborative Review
```
Find the "Project Proposal" document
Add a comment "Great work!" to it
List all comments on it
```

### 2. Sheet Comments
```
Find the "Sales Data" spreadsheet
Add a comment "Check this formula" to cell B5
```

### 3. Share and Manage
```
Find "Team Report" document
Share it with team@company.com as editor
Create a shareable link for it
List who has access to it
```

### 4. Comment Workflow
```
List all unresolved comments on document [ID]
Reply "Fixed this issue" to comment [ID]
Resolve that comment
```

## Tips

- **Get File IDs**: They're in the URL: `docs.google.com/document/d/{FILE_ID}/edit`
- **Search First**: Always search to find file IDs before operating on files
- **Comment Anchoring**: Use character indices for Docs, A1 notation for Sheets
- **Batch Operations**: You can ask Claude to perform multiple operations in sequence

## Security Notes

- Tokens are stored securely at `~/.local/share/google-drive-mcp/tokens.json`
- Never commit your Client ID/Secret to version control
- Re-authenticate if tokens are compromised: delete the tokens file and restart

---

**You're all set!** Start collaborating with Google Drive through Claude.
