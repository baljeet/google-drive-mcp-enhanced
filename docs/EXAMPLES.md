# Usage Examples

This guide provides practical examples of using the Google Drive MCP Enhanced server.

## File Operations

### Search for Documents

```
Find all Google Docs containing "meeting notes" in my Drive
```

The MCP client will call:
```json
{
  "tool": "gdrive_search",
  "arguments": {
    "query": "meeting notes",
    "mimeType": "application/vnd.google-apps.document"
  }
}
```

### List Folder Contents

```
Show me all files in the "Projects" folder
```

First, search for the folder:
```json
{
  "tool": "gdrive_search",
  "arguments": {
    "query": "Projects",
    "mimeType": "application/vnd.google-apps.folder"
  }
}
```

Then list its contents:
```json
{
  "tool": "gdrive_list_folder",
  "arguments": {
    "folderId": "folder-id-from-search"
  }
}
```

### Read a Document

```
Read the content of document ID 1abc123xyz
```

```json
{
  "tool": "gdocs_read",
  "arguments": {
    "documentId": "1abc123xyz"
  }
}
```

### Create a New Google Doc

```
Create a new Google Doc named "Project Plan"
```

```json
{
  "tool": "gdrive_create_file",
  "arguments": {
    "name": "Project Plan",
    "mimeType": "application/vnd.google-apps.document"
  }
}
```

## Comment Operations

### Add a Comment to a Document

```
Add a comment "Needs review" to document 1abc123xyz
```

```json
{
  "tool": "gdrive_create_comment",
  "arguments": {
    "fileId": "1abc123xyz",
    "content": "Needs review"
  }
}
```

### Add a Comment to Specific Text in a Document

```
Add a comment "This section is unclear" to characters 150-200 in document 1abc123xyz
```

```json
{
  "tool": "gdrive_create_comment",
  "arguments": {
    "fileId": "1abc123xyz",
    "content": "This section is unclear",
    "startIndex": 150,
    "endIndex": 200
  }
}
```

### Add a Comment to a Specific Cell in Sheets

```
Add a comment "Verify this formula" to cell B5 in spreadsheet 1xyz789abc
```

```json
{
  "tool": "gdrive_create_comment",
  "arguments": {
    "fileId": "1xyz789abc",
    "content": "Verify this formula",
    "cellReference": "B5"
  }
}
```

### List All Comments on a File

```
Show me all comments on document 1abc123xyz
```

```json
{
  "tool": "gdrive_list_comments",
  "arguments": {
    "fileId": "1abc123xyz"
  }
}
```

### List Only Unresolved Comments

```
Show me unresolved comments on document 1abc123xyz
```

```json
{
  "tool": "gdrive_list_comments",
  "arguments": {
    "fileId": "1abc123xyz",
    "resolvedOnly": false
  }
}
```

### Reply to a Comment

```
Reply "I've addressed this" to comment comment-id-123 on document 1abc123xyz
```

```json
{
  "tool": "gdrive_reply_to_comment",
  "arguments": {
    "fileId": "1abc123xyz",
    "commentId": "comment-id-123",
    "content": "I've addressed this"
  }
}
```

### Resolve a Comment

```
Resolve comment comment-id-123 on document 1abc123xyz
```

```json
{
  "tool": "gdrive_resolve_comment",
  "arguments": {
    "fileId": "1abc123xyz",
    "commentId": "comment-id-123"
  }
}
```

### Update a Comment

```
Update comment comment-id-123 to say "Updated: this is now fixed"
```

```json
{
  "tool": "gdrive_update_comment",
  "arguments": {
    "fileId": "1abc123xyz",
    "commentId": "comment-id-123",
    "content": "Updated: this is now fixed"
  }
}
```

### Delete a Comment

```
Delete comment comment-id-123 from document 1abc123xyz
```

```json
{
  "tool": "gdrive_delete_comment",
  "arguments": {
    "fileId": "1abc123xyz",
    "commentId": "comment-id-123"
  }
}
```

## Sharing Operations

### Share a Document with a User

```
Share document 1abc123xyz with user@example.com as an editor
```

```json
{
  "tool": "gdrive_share_file",
  "arguments": {
    "fileId": "1abc123xyz",
    "emailAddress": "user@example.com",
    "type": "user",
    "role": "writer",
    "sendNotificationEmail": true,
    "emailMessage": "I've shared this document with you for editing"
  }
}
```

### Create a Public Share Link

```
Create a shareable link for document 1abc123xyz with viewer access
```

```json
{
  "tool": "gdrive_create_share_link",
  "arguments": {
    "fileId": "1abc123xyz",
    "role": "reader"
  }
}
```

### List All Permissions on a File

```
Show me who has access to document 1abc123xyz
```

```json
{
  "tool": "gdrive_list_permissions",
  "arguments": {
    "fileId": "1abc123xyz"
  }
}
```

### Change Someone's Permission Level

```
Change permission perm-id-456 to commenter on document 1abc123xyz
```

```json
{
  "tool": "gdrive_update_permission",
  "arguments": {
    "fileId": "1abc123xyz",
    "permissionId": "perm-id-456",
    "role": "commenter"
  }
}
```

### Remove Access

```
Remove permission perm-id-456 from document 1abc123xyz
```

```json
{
  "tool": "gdrive_remove_permission",
  "arguments": {
    "fileId": "1abc123xyz",
    "permissionId": "perm-id-456"
  }
}
```

## Google Sheets Operations

### Read Sheet Data

```
Read cells A1 to D10 from spreadsheet 1xyz789abc
```

```json
{
  "tool": "gsheets_read",
  "arguments": {
    "spreadsheetId": "1xyz789abc",
    "range": "Sheet1!A1:D10"
  }
}
```

### Update Sheet Data

```
Update cell A1 to "Name" and B1 to "Email" in spreadsheet 1xyz789abc
```

```json
{
  "tool": "gsheets_update",
  "arguments": {
    "spreadsheetId": "1xyz789abc",
    "range": "Sheet1!A1:B1",
    "values": [["Name", "Email"]]
  }
}
```

### Get Spreadsheet Metadata

```
Get information about spreadsheet 1xyz789abc
```

```json
{
  "tool": "gsheets_get_metadata",
  "arguments": {
    "spreadsheetId": "1xyz789abc"
  }
}
```

## Google Docs Operations

### Update Document Content

```
Replace characters 1-50 with "New Introduction" in document 1abc123xyz
```

```json
{
  "tool": "gdocs_update",
  "arguments": {
    "documentId": "1abc123xyz",
    "text": "New Introduction",
    "startIndex": 1,
    "endIndex": 50
  }
}
```

### Append Text to Document

```
Add "Conclusion: This project is complete." to document 1abc123xyz
```

```json
{
  "tool": "gdocs_update",
  "arguments": {
    "documentId": "1abc123xyz",
    "text": "\n\nConclusion: This project is complete."
  }
}
```

## Suggestion Operations

### Create a Suggestion to Insert Text

```
Suggest inserting "important: " at position 50 in document 1abc123xyz
```

```json
{
  "tool": "gdocs_create_suggestion",
  "arguments": {
    "fileId": "1abc123xyz",
    "type": "insert",
    "content": "important: ",
    "startIndex": 50
  }
}
```

### List All Suggestions

```
Show me all pending suggestions in document 1abc123xyz
```

```json
{
  "tool": "gdocs_list_suggestions",
  "arguments": {
    "fileId": "1abc123xyz"
  }
}
```

### Accept a Suggestion

```
Accept suggestion sugg-id-789 in document 1abc123xyz
```

```json
{
  "tool": "gdocs_accept_suggestion",
  "arguments": {
    "fileId": "1abc123xyz",
    "suggestionId": "sugg-id-789"
  }
}
```

### Reject a Suggestion

```
Reject suggestion sugg-id-789 in document 1abc123xyz
```

```json
{
  "tool": "gdocs_reject_suggestion",
  "arguments": {
    "fileId": "1abc123xyz",
    "suggestionId": "sugg-id-789"
  }
}
```

## Complex Workflows

### Collaborative Review Workflow

1. **Find the document**:
```
Find document "Q4 Report"
```

2. **Read the document**:
```
Read the content of document [id from step 1]
```

3. **Add review comments**:
```
Add comment "Needs more details on revenue" to characters 500-600 in document [id]
Add comment "Great analysis!" to characters 1000-1200 in document [id]
```

4. **Share with team**:
```
Share document [id] with team@example.com as commenters
Create a shareable link for document [id] with commenter access
```

5. **Check all comments**:
```
Show me all comments on document [id]
```

6. **Resolve addressed comments**:
```
Resolve comment [comment-id] on document [id]
```

### Spreadsheet Data Entry with Comments

1. **Find the spreadsheet**:
```
Find spreadsheet "Sales Data 2024"
```

2. **Read current data**:
```
Read cells A1:E10 from spreadsheet [id]
```

3. **Update data**:
```
Update cells A2:B2 with values "John Doe" and "5000" in spreadsheet [id]
```

4. **Add verification comment**:
```
Add comment "Please verify this sales figure" to cell B2 in spreadsheet [id]
```

5. **Share for review**:
```
Share spreadsheet [id] with manager@example.com as editor
```

### Document Cleanup

1. **List all comments**:
```
Show me all comments on document [id]
```

2. **Resolve old comments**:
```
Resolve comment [comment-id-1] on document [id]
Resolve comment [comment-id-2] on document [id]
```

3. **Delete unnecessary comments**:
```
Delete comment [comment-id-3] from document [id]
```

4. **List only unresolved**:
```
Show me unresolved comments on document [id]
```

## Tips and Best Practices

### Getting File IDs

File IDs are in the URL of Google Drive files:
- **Docs**: `https://docs.google.com/document/d/{FILE_ID}/edit`
- **Sheets**: `https://docs.google.com/spreadsheets/d/{FILE_ID}/edit`
- **Drive**: `https://drive.google.com/file/d/{FILE_ID}/view`

Or use search to find them:
```
Find file "filename"
```

### Comment Anchoring

- **For Docs**: Use character indices to anchor comments to specific text
- **For Sheets**: Use A1 notation (e.g., "A1", "B5", "C10") to anchor to cells
- Without anchors, comments apply to the entire file

### Permission Roles

- **reader**: Can view only
- **commenter**: Can view and add comments
- **writer**: Can view, comment, and edit
- **owner**: Full control (use with caution)

### Batch Operations

When working with multiple files, search first, then iterate:
```
Search for all documents in folder "Reviews"
For each document:
  - List unresolved comments
  - Resolve old comments
  - Add a summary comment
```

### Error Handling

If a tool call fails:
1. Check that the file ID is correct
2. Verify you have appropriate permissions
3. Ensure the file hasn't been deleted
4. Check for rate limiting (wait and retry)

## Common MIME Types

- **Google Docs**: `application/vnd.google-apps.document`
- **Google Sheets**: `application/vnd.google-apps.spreadsheet`
- **Google Slides**: `application/vnd.google-apps.presentation`
- **Folder**: `application/vnd.google-apps.folder`
- **PDF**: `application/pdf`
- **Plain Text**: `text/plain`
