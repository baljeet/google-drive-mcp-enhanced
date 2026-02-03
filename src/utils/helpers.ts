import { drive_v3 } from 'googleapis';
import { FileMetadata, Comment, CommentReply } from '../types/google-drive.js';

export function formatFileMetadata(file: drive_v3.Schema$File): FileMetadata {
  return {
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    createdTime: file.createdTime!,
    modifiedTime: file.modifiedTime!,
    size: file.size || undefined,
    webViewLink: file.webViewLink || undefined,
    owners: file.owners?.map(owner => ({
      displayName: owner.displayName || 'Unknown',
      emailAddress: owner.emailAddress || '',
    })),
    parents: file.parents || undefined,
  };
}

export function formatComment(comment: drive_v3.Schema$Comment): Comment {
  return {
    id: comment.id!,
    content: comment.content!,
    author: comment.author?.displayName || 'Unknown',
    createdTime: comment.createdTime!,
    modifiedTime: comment.modifiedTime!,
    resolved: comment.resolved || false,
    anchor: comment.anchor ? {
      startIndex: (comment.anchor as any).startIndex,
      endIndex: (comment.anchor as any).endIndex,
    } : undefined,
    replies: comment.replies?.map(formatReply),
  };
}

export function formatReply(reply: drive_v3.Schema$Reply): CommentReply {
  return {
    id: reply.id!,
    content: reply.content!,
    author: reply.author?.displayName || 'Unknown',
    createdTime: reply.createdTime!,
    modifiedTime: reply.modifiedTime!,
  };
}

export function buildSearchQuery(params: {
  query?: string;
  mimeType?: string;
  folderId?: string;
}): string {
  const conditions: string[] = ['trashed = false'];

  if (params.query) {
    conditions.push(`name contains '${params.query.replace(/'/g, "\\'")}'`);
  }

  if (params.mimeType) {
    conditions.push(`mimeType = '${params.mimeType}'`);
  }

  if (params.folderId) {
    conditions.push(`'${params.folderId}' in parents`);
  }

  return conditions.join(' and ');
}

export const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  PDF: 'application/pdf',
  TEXT: 'text/plain',
} as const;

export function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.google-apps.');
}

export function getExportMimeType(mimeType: string): string | null {
  switch (mimeType) {
    case MIME_TYPES.DOCUMENT:
      return 'text/plain';
    case MIME_TYPES.SPREADSHEET:
      return 'text/csv';
    case MIME_TYPES.PRESENTATION:
      return 'text/plain';
    default:
      return null;
  }
}
