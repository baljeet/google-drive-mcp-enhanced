import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  SearchFilesSchema,
  ListFolderSchema,
  ReadFileSchema,
  CreateFileSchema,
  UpdateFileSchema,
  DeleteFileSchema,
  MoveFileSchema,
} from '../utils/validation.js';
import { handleGoogleApiError, withRetry } from '../utils/error-handler.js';
import {
  formatFileMetadata,
  buildSearchQuery,
  isGoogleWorkspaceFile,
  getExportMimeType,
  MIME_TYPES,
} from '../utils/helpers.js';

export class FileTools {
  private drive: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async searchFiles(params: unknown) {
    const validated = SearchFilesSchema.parse(params);

    try {
      const query = buildSearchQuery({
        query: validated.query,
        mimeType: validated.mimeType,
        folderId: validated.folderId,
      });

      const response = await withRetry(() =>
        this.drive.files.list({
          q: query,
          pageSize: validated.maxResults,
          fields: 'files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, owners, parents)',
          orderBy: 'modifiedTime desc',
        })
      );

      const files = response.data.files || [];
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: files.length,
                files: files.map(formatFileMetadata),
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

  async listFolder(params: unknown) {
    const validated = ListFolderSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.files.list({
          q: `'${validated.folderId}' in parents and trashed = false`,
          pageSize: validated.pageSize,
          pageToken: validated.pageToken,
          fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, owners)',
          orderBy: 'folder,name',
        })
      );

      const files = response.data.files || [];
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                files: files.map(formatFileMetadata),
                nextPageToken: response.data.nextPageToken,
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

  async readFile(params: unknown) {
    const validated = ReadFileSchema.parse(params);

    try {
      // Get file metadata
      const metadataResponse = await withRetry(() =>
        this.drive.files.get({
          fileId: validated.fileId,
          fields: 'id, name, mimeType, createdTime, modifiedTime, size, webViewLink, owners',
        })
      );

      const metadata = metadataResponse.data;
      let content = '';

      // Get file content
      if (isGoogleWorkspaceFile(metadata.mimeType!)) {
        // Export Google Workspace files
        const exportMimeType = getExportMimeType(metadata.mimeType!);
        if (exportMimeType) {
          const exportResponse = await withRetry(() =>
            this.drive.files.export(
              {
                fileId: validated.fileId,
                mimeType: exportMimeType,
              },
              { responseType: 'text' }
            )
          );
          content = exportResponse.data as string;
        }
      } else {
        // Download binary/text files
        const response = await withRetry(() =>
          this.drive.files.get(
            {
              fileId: validated.fileId,
              alt: 'media',
            },
            { responseType: 'text' }
          )
        );
        content = response.data as string;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                metadata: formatFileMetadata(metadata),
                content: content.substring(0, 100000), // Limit content size
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

  async createFile(params: unknown) {
    const validated = CreateFileSchema.parse(params);

    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: validated.name,
        mimeType: validated.mimeType,
        ...(validated.parentId && { parents: [validated.parentId] }),
      };

      let response;

      if (validated.content && !isGoogleWorkspaceFile(validated.mimeType)) {
        // Create file with content
        response = await withRetry(() =>
          this.drive.files.create({
            requestBody: fileMetadata,
            media: {
              mimeType: validated.mimeType,
              body: validated.content,
            },
            fields: 'id, name, mimeType, createdTime, webViewLink',
          })
        );
      } else {
        // Create empty file or Google Workspace file
        response = await withRetry(() =>
          this.drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, mimeType, createdTime, webViewLink',
          })
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formatFileMetadata(response.data), null, 2),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async deleteFile(params: unknown) {
    const validated = DeleteFileSchema.parse(params);

    try {
      await withRetry(() =>
        this.drive.files.delete({
          fileId: validated.fileId,
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, fileId: validated.fileId }, null, 2),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async moveFile(params: unknown) {
    const validated = MoveFileSchema.parse(params);

    try {
      // Get current parents
      const file = await withRetry(() =>
        this.drive.files.get({
          fileId: validated.fileId,
          fields: 'parents',
        })
      );

      const previousParents = file.data.parents?.join(',') || '';

      // Move file
      const response = await withRetry(() =>
        this.drive.files.update({
          fileId: validated.fileId,
          addParents: validated.newParentId,
          removeParents: previousParents,
          fields: 'id, name, mimeType, parents, webViewLink',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formatFileMetadata(response.data), null, 2),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }
}
