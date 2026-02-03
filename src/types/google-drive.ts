import { drive_v3, docs_v1, sheets_v4 } from 'googleapis';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface CommentAnchor {
  // For Google Docs
  startIndex?: number;
  endIndex?: number;

  // For Google Sheets
  cellReference?: string; // A1 notation
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdTime: string;
  modifiedTime: string;
  resolved: boolean;
  anchor?: CommentAnchor;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  content: string;
  author: string;
  createdTime: string;
  modifiedTime: string;
}

export interface Suggestion {
  id: string;
  type: 'insert' | 'delete';
  content: string;
  startIndex?: number;
  endIndex?: number;
  state: 'pending' | 'accepted' | 'rejected';
  author: string;
  createdTime: string;
}

export interface Permission {
  id: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  displayName?: string;
  expirationTime?: string;
  allowFileDiscovery?: boolean;
}

export interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
  parents?: string[];
}

export type DriveFile = drive_v3.Schema$File;
export type DriveComment = drive_v3.Schema$Comment;
export type DriveReply = drive_v3.Schema$Reply;
export type DrivePermission = drive_v3.Schema$Permission;
export type DocsDocument = docs_v1.Schema$Document;
export type SheetsSpreadsheet = sheets_v4.Schema$Spreadsheet;
