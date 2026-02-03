#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleAuthManager } from './auth/oauth.js';
import { FileTools } from './tools/files.js';
import { DocsTools } from './tools/docs.js';
import { SheetsTools } from './tools/sheets.js';
import { CommentsTools } from './tools/comments.js';
import { SuggestionsTools } from './tools/suggestions.js';
import { SharingTools } from './tools/sharing.js';

// Define all available tools
const TOOLS: Tool[] = [
  // File operations
  {
    name: 'gdrive_search',
    description: 'Search for files in Google Drive with optional filters for name, mimeType, and folder',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for file name' },
        mimeType: { type: 'string', description: 'Filter by MIME type (e.g., application/vnd.google-apps.document)' },
        folderId: { type: 'string', description: 'Search within specific folder ID' },
        maxResults: { type: 'number', description: 'Maximum number of results (1-1000)', default: 100 },
      },
    },
  },
  {
    name: 'gdrive_list_folder',
    description: 'List contents of a specific folder with pagination support',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: { type: 'string', description: 'ID of the folder to list' },
        pageSize: { type: 'number', description: 'Number of items per page (1-1000)', default: 100 },
        pageToken: { type: 'string', description: 'Token for next page of results' },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'gdrive_read_file',
    description: 'Read file metadata and content. Supports Google Docs, Sheets, and regular files',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file to read' },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'gdrive_create_file',
    description: 'Create a new file in Google Drive',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the file' },
        mimeType: { type: 'string', description: 'MIME type of the file' },
        content: { type: 'string', description: 'Content of the file (optional for Google Workspace files)' },
        parentId: { type: 'string', description: 'Parent folder ID' },
      },
      required: ['name', 'mimeType'],
    },
  },
  {
    name: 'gdrive_delete_file',
    description: 'Delete a file from Google Drive',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file to delete' },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'gdrive_move_file',
    description: 'Move a file to a different folder',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file to move' },
        newParentId: { type: 'string', description: 'ID of the destination folder' },
      },
      required: ['fileId', 'newParentId'],
    },
  },

  // Google Docs operations
  {
    name: 'gdocs_read',
    description: 'Read content from a Google Docs document',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'ID of the Google Docs document' },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'gdocs_update',
    description: 'Update content in a Google Docs document',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'ID of the Google Docs document' },
        text: { type: 'string', description: 'Text to insert or replace' },
        startIndex: { type: 'number', description: 'Start position for replacement (optional)' },
        endIndex: { type: 'number', description: 'End position for replacement (optional)' },
      },
      required: ['documentId', 'text'],
    },
  },

  // Google Sheets operations
  {
    name: 'gsheets_get_metadata',
    description: 'Get metadata about a Google Sheets spreadsheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'ID of the spreadsheet' },
      },
      required: ['spreadsheetId'],
    },
  },
  {
    name: 'gsheets_read',
    description: 'Read data from a Google Sheets spreadsheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'ID of the spreadsheet' },
        range: { type: 'string', description: 'A1 notation range (e.g., Sheet1!A1:D10)' },
      },
      required: ['spreadsheetId'],
    },
  },
  {
    name: 'gsheets_update',
    description: 'Update data in a Google Sheets spreadsheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'ID of the spreadsheet' },
        range: { type: 'string', description: 'A1 notation range (e.g., Sheet1!A1:D10)' },
        values: { type: 'array', description: 'Array of arrays containing cell values' },
      },
      required: ['spreadsheetId', 'range', 'values'],
    },
  },

  // Comment operations
  {
    name: 'gdrive_create_comment',
    description: 'Create a comment on a Google Drive file (Docs or Sheets). For Docs, optionally anchor to text selection. For Sheets, anchor to specific cell.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        content: { type: 'string', description: 'Comment text' },
        startIndex: { type: 'number', description: 'Start position in Docs (optional)' },
        endIndex: { type: 'number', description: 'End position in Docs (optional)' },
        cellReference: { type: 'string', description: 'Cell reference in Sheets (e.g., A1) (optional)' },
      },
      required: ['fileId', 'content'],
    },
  },
  {
    name: 'gdrive_list_comments',
    description: 'List all comments on a file',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        includeDeleted: { type: 'boolean', description: 'Include deleted comments', default: false },
        resolvedOnly: { type: 'boolean', description: 'Filter by resolved status' },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'gdrive_get_comment',
    description: 'Get details of a specific comment',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        commentId: { type: 'string', description: 'ID of the comment' },
      },
      required: ['fileId', 'commentId'],
    },
  },
  {
    name: 'gdrive_update_comment',
    description: 'Update the content of a comment',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        commentId: { type: 'string', description: 'ID of the comment' },
        content: { type: 'string', description: 'New comment text' },
      },
      required: ['fileId', 'commentId', 'content'],
    },
  },
  {
    name: 'gdrive_delete_comment',
    description: 'Delete a comment',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        commentId: { type: 'string', description: 'ID of the comment' },
      },
      required: ['fileId', 'commentId'],
    },
  },
  {
    name: 'gdrive_reply_to_comment',
    description: 'Add a reply to a comment thread',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        commentId: { type: 'string', description: 'ID of the comment to reply to' },
        content: { type: 'string', description: 'Reply text' },
      },
      required: ['fileId', 'commentId', 'content'],
    },
  },
  {
    name: 'gdrive_resolve_comment',
    description: 'Mark a comment as resolved',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        commentId: { type: 'string', description: 'ID of the comment' },
      },
      required: ['fileId', 'commentId'],
    },
  },
  {
    name: 'gdrive_reopen_comment',
    description: 'Reopen a resolved comment',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        commentId: { type: 'string', description: 'ID of the comment' },
      },
      required: ['fileId', 'commentId'],
    },
  },

  // Suggestion operations
  {
    name: 'gdocs_create_suggestion',
    description: 'Create a suggestion in a Google Docs document (Note: Limited API support, prefer comments)',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the document' },
        type: { type: 'string', enum: ['insert', 'delete'], description: 'Type of suggestion' },
        content: { type: 'string', description: 'Content to insert or delete' },
        startIndex: { type: 'number', description: 'Start position' },
        endIndex: { type: 'number', description: 'End position (for delete)' },
      },
      required: ['fileId', 'type', 'content', 'startIndex'],
    },
  },
  {
    name: 'gdocs_list_suggestions',
    description: 'List all pending suggestions in a document',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the document' },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'gdocs_accept_suggestion',
    description: 'Accept a suggestion',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the document' },
        suggestionId: { type: 'string', description: 'ID of the suggestion' },
      },
      required: ['fileId', 'suggestionId'],
    },
  },
  {
    name: 'gdocs_reject_suggestion',
    description: 'Reject a suggestion',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the document' },
        suggestionId: { type: 'string', description: 'ID of the suggestion' },
      },
      required: ['fileId', 'suggestionId'],
    },
  },

  // Sharing operations
  {
    name: 'gdrive_share_file',
    description: 'Share a file with a user, group, or domain',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        emailAddress: { type: 'string', description: 'Email address (for user/group type)' },
        type: { type: 'string', enum: ['user', 'group', 'domain', 'anyone'], description: 'Permission type' },
        role: { type: 'string', enum: ['reader', 'commenter', 'writer', 'owner'], description: 'Access role' },
        sendNotificationEmail: { type: 'boolean', description: 'Send email notification', default: true },
        emailMessage: { type: 'string', description: 'Custom message for notification' },
      },
      required: ['fileId', 'type', 'role'],
    },
  },
  {
    name: 'gdrive_create_share_link',
    description: 'Create a shareable link for a file',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        role: { type: 'string', enum: ['reader', 'commenter', 'writer'], description: 'Access role', default: 'reader' },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'gdrive_list_permissions',
    description: 'List all permissions for a file',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'gdrive_update_permission',
    description: 'Update an existing permission',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        permissionId: { type: 'string', description: 'ID of the permission' },
        role: { type: 'string', enum: ['reader', 'commenter', 'writer', 'owner'], description: 'New access role' },
      },
      required: ['fileId', 'permissionId', 'role'],
    },
  },
  {
    name: 'gdrive_remove_permission',
    description: 'Remove a permission from a file',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'ID of the file' },
        permissionId: { type: 'string', description: 'ID of the permission to remove' },
      },
      required: ['fileId', 'permissionId'],
    },
  },
];

class GoogleDriveMCPServer {
  private server: Server;
  private authManager!: GoogleAuthManager;
  private fileTools!: FileTools;
  private docsTools!: DocsTools;
  private sheetsTools!: SheetsTools;
  private commentsTools!: CommentsTools;
  private suggestionsTools!: SuggestionsTools;
  private sharingTools!: SharingTools;

  constructor() {
    this.server = new Server(
      {
        name: 'google-drive-mcp-enhanced',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // File operations
        if (name === 'gdrive_search') return await this.fileTools.searchFiles(args);
        if (name === 'gdrive_list_folder') return await this.fileTools.listFolder(args);
        if (name === 'gdrive_read_file') return await this.fileTools.readFile(args);
        if (name === 'gdrive_create_file') return await this.fileTools.createFile(args);
        if (name === 'gdrive_delete_file') return await this.fileTools.deleteFile(args);
        if (name === 'gdrive_move_file') return await this.fileTools.moveFile(args);

        // Google Docs operations
        if (name === 'gdocs_read') return await this.docsTools.readDocument(args);
        if (name === 'gdocs_update') return await this.docsTools.updateDocument(args);

        // Google Sheets operations
        if (name === 'gsheets_get_metadata') return await this.sheetsTools.getMetadata(args);
        if (name === 'gsheets_read') return await this.sheetsTools.readSheet(args);
        if (name === 'gsheets_update') return await this.sheetsTools.updateSheet(args);

        // Comment operations
        if (name === 'gdrive_create_comment') return await this.commentsTools.createComment(args);
        if (name === 'gdrive_list_comments') return await this.commentsTools.listComments(args);
        if (name === 'gdrive_get_comment') return await this.commentsTools.getComment(args);
        if (name === 'gdrive_update_comment') return await this.commentsTools.updateComment(args);
        if (name === 'gdrive_delete_comment') return await this.commentsTools.deleteComment(args);
        if (name === 'gdrive_reply_to_comment') return await this.commentsTools.replyToComment(args);
        if (name === 'gdrive_resolve_comment') return await this.commentsTools.resolveComment(args);
        if (name === 'gdrive_reopen_comment') return await this.commentsTools.reopenComment(args);

        // Suggestion operations
        if (name === 'gdocs_create_suggestion') return await this.suggestionsTools.createSuggestion(args);
        if (name === 'gdocs_list_suggestions') return await this.suggestionsTools.listSuggestions(args);
        if (name === 'gdocs_accept_suggestion') return await this.suggestionsTools.acceptSuggestion(args);
        if (name === 'gdocs_reject_suggestion') return await this.suggestionsTools.rejectSuggestion(args);

        // Sharing operations
        if (name === 'gdrive_share_file') return await this.sharingTools.shareFile(args);
        if (name === 'gdrive_create_share_link') return await this.sharingTools.createShareLink(args);
        if (name === 'gdrive_list_permissions') return await this.sharingTools.listPermissions(args);
        if (name === 'gdrive_update_permission') return await this.sharingTools.updatePermission(args);
        if (name === 'gdrive_remove_permission') return await this.sharingTools.removePermission(args);

        throw new Error(`Unknown tool: ${name}`);
      } catch (error: any) {
        console.error('Tool execution error:', error);
        throw error;
      }
    });
  }

  async initialize() {
    // Initialize authentication
    this.authManager = new GoogleAuthManager();
    const authClient = await this.authManager.authenticate();

    // Initialize tool handlers
    this.fileTools = new FileTools(authClient);
    this.docsTools = new DocsTools(authClient);
    this.sheetsTools = new SheetsTools(authClient);
    this.commentsTools = new CommentsTools(authClient);
    this.suggestionsTools = new SuggestionsTools(authClient);
    this.sharingTools = new SharingTools(authClient);
  }

  async run() {
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Drive MCP Enhanced Server running on stdio');
  }
}

// Start the server
const server = new GoogleDriveMCPServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
