import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  CreateCommentSchema,
  ListCommentsSchema,
  GetCommentSchema,
  UpdateCommentSchema,
  DeleteCommentSchema,
  ReplyToCommentSchema,
  ResolveCommentSchema,
  ReopenCommentSchema,
} from '../utils/validation.js';
import { handleGoogleApiError, withRetry } from '../utils/error-handler.js';
import { formatComment } from '../utils/helpers.js';

export class CommentsTools {
  private drive: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async createComment(params: unknown) {
    const validated = CreateCommentSchema.parse(params);

    try {
      const commentData: drive_v3.Schema$Comment = {
        content: validated.content,
      };

      // Add anchor for Google Docs (text selection)
      if (validated.startIndex !== undefined) {
        commentData.anchor = JSON.stringify({
          r: 'head',
          a: [
            {
              txt: {
                o: validated.startIndex,
                l: validated.endIndex
                  ? validated.endIndex - validated.startIndex
                  : 0,
                ts: 0,
              },
            },
          ],
        });
      }

      // Add quoted file content for Google Sheets (cell reference)
      if (validated.cellReference) {
        commentData.quotedFileContent = {
          mimeType: 'application/vnd.google-apps.spreadsheet',
          value: validated.cellReference,
        };
      }

      const response = await withRetry(() =>
        this.drive.comments.create({
          fileId: validated.fileId,
          requestBody: commentData,
          fields: 'id, content, author, createdTime, modifiedTime, resolved, anchor, quotedFileContent, replies',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                comment: formatComment(response.data),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async listComments(params: unknown) {
    const validated = ListCommentsSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.comments.list({
          fileId: validated.fileId,
          includeDeleted: validated.includeDeleted,
          fields: 'comments(id, content, author, createdTime, modifiedTime, resolved, anchor, quotedFileContent, replies)',
        })
      );

      let comments = response.data.comments || [];

      // Filter by resolved status if specified
      if (validated.resolvedOnly !== undefined) {
        comments = comments.filter(c => c.resolved === validated.resolvedOnly);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: comments.length,
                comments: comments.map(formatComment),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async getComment(params: unknown) {
    const validated = GetCommentSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.comments.get({
          fileId: validated.fileId,
          commentId: validated.commentId,
          fields: 'id, content, author, createdTime, modifiedTime, resolved, anchor, quotedFileContent, replies',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formatComment(response.data), null, 2),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async updateComment(params: unknown) {
    const validated = UpdateCommentSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.comments.update({
          fileId: validated.fileId,
          commentId: validated.commentId,
          requestBody: {
            content: validated.content,
          },
          fields: 'id, content, author, createdTime, modifiedTime, resolved',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                comment: formatComment(response.data),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async deleteComment(params: unknown) {
    const validated = DeleteCommentSchema.parse(params);

    try {
      await withRetry(() =>
        this.drive.comments.delete({
          fileId: validated.fileId,
          commentId: validated.commentId,
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                commentId: validated.commentId,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async replyToComment(params: unknown) {
    const validated = ReplyToCommentSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.replies.create({
          fileId: validated.fileId,
          commentId: validated.commentId,
          requestBody: {
            content: validated.content,
          },
          fields: 'id, content, author, createdTime, modifiedTime',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                reply: {
                  id: response.data.id,
                  content: response.data.content,
                  author: response.data.author?.displayName || 'Unknown',
                  createdTime: response.data.createdTime,
                  modifiedTime: response.data.modifiedTime,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async resolveComment(params: unknown) {
    const validated = ResolveCommentSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.comments.update({
          fileId: validated.fileId,
          commentId: validated.commentId,
          requestBody: {
            resolved: true,
          },
          fields: 'id, content, resolved, modifiedTime',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                commentId: response.data.id,
                resolved: response.data.resolved,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async reopenComment(params: unknown) {
    const validated = ReopenCommentSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.comments.update({
          fileId: validated.fileId,
          commentId: validated.commentId,
          requestBody: {
            resolved: false,
          },
          fields: 'id, content, resolved, modifiedTime',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                commentId: response.data.id,
                resolved: response.data.resolved,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }
}
