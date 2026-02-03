import { z } from 'zod';

// File operation schemas
export const SearchFilesSchema = z.object({
  query: z.string().optional(),
  mimeType: z.string().optional(),
  folderId: z.string().optional(),
  maxResults: z.number().min(1).max(1000).default(100),
});

export const ListFolderSchema = z.object({
  folderId: z.string(),
  pageSize: z.number().min(1).max(1000).default(100),
  pageToken: z.string().optional(),
});

export const ReadFileSchema = z.object({
  fileId: z.string(),
});

export const CreateFileSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  content: z.string().optional(),
  parentId: z.string().optional(),
});

export const UpdateFileSchema = z.object({
  fileId: z.string(),
  content: z.string(),
});

export const DeleteFileSchema = z.object({
  fileId: z.string(),
});

export const MoveFileSchema = z.object({
  fileId: z.string(),
  newParentId: z.string(),
});

// Comment operation schemas
export const CreateCommentSchema = z.object({
  fileId: z.string(),
  content: z.string(),
  startIndex: z.number().optional(),
  endIndex: z.number().optional(),
  cellReference: z.string().optional(),
});

export const ListCommentsSchema = z.object({
  fileId: z.string(),
  includeDeleted: z.boolean().default(false),
  resolvedOnly: z.boolean().optional(),
});

export const GetCommentSchema = z.object({
  fileId: z.string(),
  commentId: z.string(),
});

export const UpdateCommentSchema = z.object({
  fileId: z.string(),
  commentId: z.string(),
  content: z.string(),
});

export const DeleteCommentSchema = z.object({
  fileId: z.string(),
  commentId: z.string(),
});

export const ReplyToCommentSchema = z.object({
  fileId: z.string(),
  commentId: z.string(),
  content: z.string(),
});

export const ResolveCommentSchema = z.object({
  fileId: z.string(),
  commentId: z.string(),
});

export const ReopenCommentSchema = z.object({
  fileId: z.string(),
  commentId: z.string(),
});

// Suggestion operation schemas
export const CreateSuggestionSchema = z.object({
  fileId: z.string(),
  type: z.enum(['insert', 'delete']),
  content: z.string(),
  startIndex: z.number(),
  endIndex: z.number().optional(),
});

export const ListSuggestionsSchema = z.object({
  fileId: z.string(),
});

export const AcceptSuggestionSchema = z.object({
  fileId: z.string(),
  suggestionId: z.string(),
});

export const RejectSuggestionSchema = z.object({
  fileId: z.string(),
  suggestionId: z.string(),
});

// Sharing operation schemas
export const ShareFileSchema = z.object({
  fileId: z.string(),
  emailAddress: z.string().email().optional(),
  type: z.enum(['user', 'group', 'domain', 'anyone']),
  role: z.enum(['reader', 'commenter', 'writer', 'owner']),
  sendNotificationEmail: z.boolean().default(true),
  emailMessage: z.string().optional(),
});

export const CreateShareLinkSchema = z.object({
  fileId: z.string(),
  role: z.enum(['reader', 'commenter', 'writer']).default('reader'),
});

export const ListPermissionsSchema = z.object({
  fileId: z.string(),
});

export const UpdatePermissionSchema = z.object({
  fileId: z.string(),
  permissionId: z.string(),
  role: z.enum(['reader', 'commenter', 'writer', 'owner']),
});

export const RemovePermissionSchema = z.object({
  fileId: z.string(),
  permissionId: z.string(),
});
