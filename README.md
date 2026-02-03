# Google Drive MCP Enhanced

A comprehensive Model Context Protocol (MCP) server for Google Drive with enhanced collaboration features including full comment support, suggestions, and sharing management.

## Features

### Core Capabilities
- **File Operations**: Search, list, read, create, delete, and move files
- **Google Docs**: Read and update document content
- **Google Sheets**: Read and update spreadsheet data
- **Comments** ⭐: Create, read, update, delete, reply, resolve comments on Docs and Sheets
- **Suggestions**: Create, list, accept, and reject suggestions in Google Docs
- **Sharing**: Manage file permissions and create shareable links

### Key Differentiators
This implementation stands out from existing Google Drive MCP servers by providing:
- ✅ **Full comment support** for both Google Docs and Sheets
- ✅ Comment anchoring (text selection in Docs, cell references in Sheets)
- ✅ Comment threads with replies
- ✅ Comment resolution workflow
- ✅ Comprehensive sharing and permissions management
- ✅ Suggestion tracking for collaborative editing

## Installation

### Prerequisites
- Node.js 18 or higher
- Google Cloud Project with Drive, Docs, and Sheets APIs enabled
- OAuth 2.0 credentials (see Setup Guide below)

### Install Dependencies

```bash
cd google-drive-mcp-enhanced
npm install
```

### Build

```bash
npm run build
```

## Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Docs API
   - Google Sheets API

### 2. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Configure the consent screen if prompted
4. Choose **Desktop app** as application type
5. Download the credentials JSON file

### 3. Set Environment Variables

```bash
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

Or create a `.env` file:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "google-drive-enhanced": {
      "command": "node",
      "args": ["/path/to/google-drive-mcp-enhanced/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### 5. First Run - Authentication

On first run, the server will:
1. Open your browser for Google OAuth
2. Ask you to authorize the application
3. Save tokens securely to `~/.local/share/google-drive-mcp/tokens.json`

## Available Tools

### File Operations

#### `gdrive_search`
Search for files with optional filters.

```json
{
  "query": "meeting notes",
  "mimeType": "application/vnd.google-apps.document",
  "maxResults": 10
}
```

#### `gdrive_list_folder`
List contents of a folder.

```json
{
  "folderId": "folder-id-here",
  "pageSize": 50
}
```

#### `gdrive_read_file`
Read file metadata and content.

```json
{
  "fileId": "file-id-here"
}
```

#### `gdrive_create_file`
Create a new file.

```json
{
  "name": "New Document",
  "mimeType": "application/vnd.google-apps.document",
  "parentId": "folder-id"
}
```

#### `gdrive_delete_file`
Delete a file.

```json
{
  "fileId": "file-id-here"
}
```

#### `gdrive_move_file`
Move a file to different folder.

```json
{
  "fileId": "file-id-here",
  "newParentId": "folder-id"
}
```

### Google Docs Operations

#### `gdocs_read`
Read document content.

```json
{
  "documentId": "doc-id-here"
}
```

#### `gdocs_update`
Update document content.

```json
{
  "documentId": "doc-id-here",
  "text": "New content",
  "startIndex": 1,
  "endIndex": 10
}
```

### Google Sheets Operations

#### `gsheets_get_metadata`
Get spreadsheet metadata.

```json
{
  "spreadsheetId": "sheet-id-here"
}
```

#### `gsheets_read`
Read sheet data.

```json
{
  "spreadsheetId": "sheet-id-here",
  "range": "Sheet1!A1:D10"
}
```

#### `gsheets_update`
Update sheet data.

```json
{
  "spreadsheetId": "sheet-id-here",
  "range": "Sheet1!A1:B2",
  "values": [["Name", "Email"], ["John", "john@example.com"]]
}
```

### Comment Operations ⭐

#### `gdrive_create_comment`
Create a comment on a file. For Docs, optionally anchor to text selection. For Sheets, anchor to cell.

```json
{
  "fileId": "file-id-here",
  "content": "This needs revision",
  "startIndex": 10,
  "endIndex": 50
}
```

For Sheets:
```json
{
  "fileId": "sheet-id-here",
  "content": "Check this value",
  "cellReference": "A1"
}
```

#### `gdrive_list_comments`
List all comments on a file.

```json
{
  "fileId": "file-id-here",
  "resolvedOnly": false
}
```

#### `gdrive_get_comment`
Get specific comment details.

```json
{
  "fileId": "file-id-here",
  "commentId": "comment-id"
}
```

#### `gdrive_update_comment`
Update comment content.

```json
{
  "fileId": "file-id-here",
  "commentId": "comment-id",
  "content": "Updated comment text"
}
```

#### `gdrive_delete_comment`
Delete a comment.

```json
{
  "fileId": "file-id-here",
  "commentId": "comment-id"
}
```

#### `gdrive_reply_to_comment`
Add a reply to a comment thread.

```json
{
  "fileId": "file-id-here",
  "commentId": "comment-id",
  "content": "I agree with this"
}
```

#### `gdrive_resolve_comment`
Mark a comment as resolved.

```json
{
  "fileId": "file-id-here",
  "commentId": "comment-id"
}
```

#### `gdrive_reopen_comment`
Reopen a resolved comment.

```json
{
  "fileId": "file-id-here",
  "commentId": "comment-id"
}
```

### Sharing Operations

#### `gdrive_share_file`
Share a file with a user, group, or domain.

```json
{
  "fileId": "file-id-here",
  "emailAddress": "user@example.com",
  "type": "user",
  "role": "writer",
  "sendNotificationEmail": true,
  "emailMessage": "Check out this document"
}
```

#### `gdrive_create_share_link`
Create a shareable link.

```json
{
  "fileId": "file-id-here",
  "role": "reader"
}
```

#### `gdrive_list_permissions`
List all permissions for a file.

```json
{
  "fileId": "file-id-here"
}
```

#### `gdrive_update_permission`
Update an existing permission.

```json
{
  "fileId": "file-id-here",
  "permissionId": "permission-id",
  "role": "commenter"
}
```

#### `gdrive_remove_permission`
Remove a permission.

```json
{
  "fileId": "file-id-here",
  "permissionId": "permission-id"
}
```

### Suggestion Operations

#### `gdocs_create_suggestion`
Create a suggestion in a document.

```json
{
  "fileId": "doc-id-here",
  "type": "insert",
  "content": "suggested text",
  "startIndex": 10
}
```

#### `gdocs_list_suggestions`
List pending suggestions.

```json
{
  "fileId": "doc-id-here"
}
```

#### `gdocs_accept_suggestion`
Accept a suggestion.

```json
{
  "fileId": "doc-id-here",
  "suggestionId": "suggestion-id"
}
```

#### `gdocs_reject_suggestion`
Reject a suggestion.

```json
{
  "fileId": "doc-id-here",
  "suggestionId": "suggestion-id"
}
```

## Usage Examples

See [EXAMPLES.md](docs/EXAMPLES.md) for detailed usage examples.

## Security

- OAuth tokens are stored securely in `~/.local/share/google-drive-mcp/tokens.json` with 0600 permissions
- Automatic token refresh when expired
- PKCE flow for enhanced OAuth security

## Troubleshooting

### Authentication Issues
- Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly
- Delete `~/.local/share/google-drive-mcp/tokens.json` and re-authenticate
- Check that all required APIs are enabled in Google Cloud Console

### Permission Errors
- Verify OAuth consent screen has the correct scopes
- Re-authenticate to grant missing permissions

### Rate Limiting
- The server implements automatic retry with exponential backoff
- Consider reducing request frequency if hitting rate limits

## License

MIT

## Contributing

Contributions welcome! Please open an issue or pull request.

## Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - Official MCP SDK
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) - Google APIs Node.js client
